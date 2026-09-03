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
if ($contentLength > 20000) {
    respond(413, ['success' => false, 'message' => 'La demande est trop volumineuse.']);
}

// Refuse les envois provenant d'un autre site lorsque le navigateur fournit l'origine.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestHost = strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
$originHost = $origin !== '' ? strtolower((string) parse_url($origin, PHP_URL_HOST)) : '';
$normalizedRequestHost = (string) preg_replace('/^www\./', '', $requestHost);
$normalizedOriginHost = (string) preg_replace('/^www\./', '', $originHost);

if ($originHost !== '' && $normalizedRequestHost !== '' && $normalizedOriginHost !== $normalizedRequestHost) {
    respond(403, ['success' => false, 'message' => 'Origine de la demande non autorisée.']);
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '', true);

if (!is_array($payload)) {
    respond(400, ['success' => false, 'message' => 'Les informations reçues sont invalides.']);
}

// Champ invisible : les robots le remplissent souvent, contrairement aux visiteurs humains.
$website = clean_single_line($payload['website'] ?? '');
if ($website !== '') {
    respond(200, ['success' => true]);
}

$allowedServices = [
    'Entretien de vos bureaux',
    'Copropriétés & résidences',
    'Nettoyage ponctuel',
    'Remise en état',
];
$allowedFrequencies = [
    'Quotidien (5j/7)',
    '2 à 3 fois par semaine',
    '1 fois par semaine',
    'Toutes les 2 semaines',
    '1 fois par mois',
    'Intervention unique',
];

$service = clean_single_line($payload['service'] ?? '');
$surface = clean_single_line($payload['surface'] ?? '');
$frequency = clean_single_line($payload['frequency'] ?? '');
$name = clean_single_line($payload['name'] ?? '');
$email = clean_single_line($payload['email'] ?? '');
$phone = clean_single_line($payload['phone'] ?? '');
$address = clean_single_line($payload['address'] ?? '');
$details = clean_multiline($payload['message'] ?? '');
$consent = filter_var($payload['consent'] ?? false, FILTER_VALIDATE_BOOLEAN);

if (!in_array($service, $allowedServices, true)) {
    respond(422, ['success' => false, 'message' => 'Sélectionnez une prestation valide.']);
}
if (!in_array($frequency, $allowedFrequencies, true)) {
    respond(422, ['success' => false, 'message' => 'Sélectionnez une fréquence valide.']);
}
if (text_length($name) < 2 || text_length($name) > 120) {
    respond(422, ['success' => false, 'message' => 'Renseignez un nom ou une entreprise valide.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || text_length($email) > 180) {
    respond(422, ['success' => false, 'message' => 'Renseignez une adresse e-mail valide.']);
}
if (text_length($phone) < 8 || text_length($phone) > 30 || !preg_match('/^[0-9+().\s-]+$/u', $phone)) {
    respond(422, ['success' => false, 'message' => 'Renseignez un numéro de téléphone valide.']);
}
if (text_length($address) < 3 || text_length($address) > 220) {
    respond(422, ['success' => false, 'message' => 'Renseignez une ville ou une adresse valide.']);
}
if (text_length($details) < 10 || text_length($details) > 2500) {
    respond(422, ['success' => false, 'message' => 'Ajoutez au moins 10 caractères de précisions.']);
}
if (!$consent) {
    respond(422, ['success' => false, 'message' => 'Le consentement à être recontacté est requis.']);
}

$surfaceLabel = 'Non précisée';
if ($surface !== '') {
    $normalizedSurface = str_replace(',', '.', $surface);
    $surfaceNumber = filter_var($normalizedSurface, FILTER_VALIDATE_FLOAT);
    if ($surfaceNumber === false || $surfaceNumber <= 0 || $surfaceNumber > 100000) {
        respond(422, ['success' => false, 'message' => 'Renseignez une surface valide.']);
    }
    $surfaceLabel = $surface . ' m²';
}

$recipient = 'contact@toulhygiene.fr';
$subjectText = 'Nouvelle demande de devis — ' . $name;
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$body = implode("\r\n", [
    "Nouvelle demande de devis depuis toulhygiene.fr",
    "",
    "Prestation : " . $service,
    "Surface approximative : " . $surfaceLabel,
    "Fréquence souhaitée : " . $frequency,
    "",
    "Nom / entreprise : " . $name,
    "Adresse e-mail : " . $email,
    "Téléphone : " . $phone,
    "Ville / adresse : " . $address,
    "",
    "Détails :",
    $details,
    "",
    "Consentement à être recontacté : Oui",
]);
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: =?UTF-8?B?' . base64_encode("Site Toul'hygiène") . '?= <contact@toulhygiene.fr>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(502, ['success' => false, 'message' => 'L’envoi n’a pas abouti. Réessayez ou écrivez à contact@toulhygiene.fr.']);
}

respond(200, ['success' => true]);

