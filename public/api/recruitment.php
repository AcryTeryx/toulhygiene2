<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_single_line($value): string
{
    $value = is_string($value) ? strip_tags($value) : '';
    return trim((string) preg_replace('/[\r\n\t]+/u', ' ', $value));
}

function clean_multiline($value): string
{
    $value = is_string($value) ? strip_tags($value) : '';
    return trim(str_replace(["\r\n", "\r"], "\n", $value));
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['success' => false, 'message' => 'Méthode non autorisée.']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 8 * 1024 * 1024) {
    respond(413, ['success' => false, 'message' => 'La candidature est trop volumineuse.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestHost = strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
$originHost = $origin !== '' ? strtolower((string) parse_url($origin, PHP_URL_HOST)) : '';
$normalizedRequestHost = (string) preg_replace('/^www\./', '', $requestHost);
$normalizedOriginHost = (string) preg_replace('/^www\./', '', $originHost);

if ($originHost !== '' && $normalizedRequestHost !== '' && $normalizedOriginHost !== $normalizedRequestHost) {
    respond(403, ['success' => false, 'message' => 'Origine de la demande non autorisée.']);
}

$website = clean_single_line($_POST['website'] ?? '');
if ($website !== '') {
    respond(200, ['success' => true]);
}

$allowedPositions = [
    'Agent d’entretien éco-mobile (à vélo / transports)',
    'Chef d’équipe nettoyage professionnel',
    'Agent spécialiste vitrerie & remise en état',
    'Candidature spontanée',
];

$lastName = clean_single_line($_POST['lastName'] ?? '');
$firstName = clean_single_line($_POST['firstName'] ?? '');
$email = clean_single_line($_POST['email'] ?? '');
$phone = clean_single_line($_POST['phone'] ?? '');
$position = clean_single_line($_POST['position'] ?? '');
$message = clean_multiline($_POST['message'] ?? '');

if (text_length($lastName) < 2 || text_length($lastName) > 80) {
    respond(422, ['success' => false, 'message' => 'Renseignez un nom valide.']);
}
if (text_length($firstName) < 2 || text_length($firstName) > 80) {
    respond(422, ['success' => false, 'message' => 'Renseignez un prénom valide.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || text_length($email) > 180) {
    respond(422, ['success' => false, 'message' => 'Renseignez une adresse e-mail valide.']);
}
if (text_length($phone) < 8 || text_length($phone) > 30 || !preg_match('/^[0-9+().\s-]+$/u', $phone)) {
    respond(422, ['success' => false, 'message' => 'Renseignez un numéro de téléphone valide.']);
}
if (!in_array($position, $allowedPositions, true)) {
    respond(422, ['success' => false, 'message' => 'Sélectionnez un poste valide.']);
}
if (text_length($message) > 2500) {
    respond(422, ['success' => false, 'message' => 'Le message de motivation est trop long.']);
}

if (!isset($_FILES['cv']) || !is_array($_FILES['cv'])) {
    respond(422, ['success' => false, 'message' => 'Ajoutez votre CV.']);
}

$cv = $_FILES['cv'];
if (($cv['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respond(422, ['success' => false, 'message' => 'Le CV n’a pas pu être reçu. Vérifiez qu’il ne dépasse pas 5 Mo.']);
}

$fileSize = (int) ($cv['size'] ?? 0);
$temporaryPath = (string) ($cv['tmp_name'] ?? '');
$originalName = basename(clean_single_line($cv['name'] ?? 'cv'));
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if ($fileSize <= 0 || $fileSize > 5 * 1024 * 1024 || !is_uploaded_file($temporaryPath)) {
    respond(422, ['success' => false, 'message' => 'Le CV est vide ou dépasse la limite de 5 Mo.']);
}

$allowedMimeTypes = [
    'pdf' => ['application/pdf'],
    'png' => ['image/png'],
    'docx' => [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/octet-stream',
    ],
];

if (!isset($allowedMimeTypes[$extension])) {
    respond(422, ['success' => false, 'message' => 'Le CV doit être au format PDF, DOCX ou PNG.']);
}

$fileInfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = (string) $fileInfo->file($temporaryPath);
if (!in_array($mimeType, $allowedMimeTypes[$extension], true)) {
    respond(422, ['success' => false, 'message' => 'Le contenu du CV ne correspond pas au format annoncé.']);
}

$fileContent = file_get_contents($temporaryPath);
if ($fileContent === false) {
    respond(500, ['success' => false, 'message' => 'Le CV n’a pas pu être préparé pour l’envoi.']);
}

$safeFileName = (string) preg_replace('/[^A-Za-z0-9._-]+/', '-', $originalName);
if ($safeFileName === '' || $safeFileName === '.' . $extension) {
    $safeFileName = 'cv-' . strtolower($firstName . '-' . $lastName) . '.' . $extension;
}

$recipient = 'contact@toulhygiene.fr';
$subjectText = 'Nouvelle candidature — ' . $firstName . ' ' . $lastName;
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$textBody = implode("\r\n", [
    "Nouvelle candidature depuis toulhygiene.fr",
    "",
    "Nom : " . $lastName,
    "Prénom : " . $firstName,
    "Adresse e-mail : " . $email,
    "Téléphone : " . $phone,
    "Poste recherché : " . $position,
    "",
    "Message de motivation :",
    $message !== '' ? $message : 'Non renseigné',
    "",
    "CV joint : " . $safeFileName,
]);
$boundary = '=_ToulHygiene_' . bin2hex(random_bytes(12));
$body = '--' . $boundary . "\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= $textBody . "\r\n\r\n";
$body .= '--' . $boundary . "\r\n";
$body .= 'Content-Type: ' . $mimeType . '; name="' . $safeFileName . '"' . "\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n";
$body .= 'Content-Disposition: attachment; filename="' . $safeFileName . '"' . "\r\n\r\n";
$body .= chunk_split(base64_encode($fileContent)) . "\r\n";
$body .= '--' . $boundary . "--\r\n";
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
    'From: =?UTF-8?B?' . base64_encode("Site Toul'hygiène") . '?= <contact@toulhygiene.fr>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(502, ['success' => false, 'message' => 'L’envoi n’a pas abouti. Réessayez ou écrivez à contact@toulhygiene.fr.']);
}

respond(200, ['success' => true]);

