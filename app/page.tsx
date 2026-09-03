'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, Leaf, LoaderCircle, Recycle, Send, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type QuoteDraft = {
  service: string;
  surface: string;
  frequency: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  consent: boolean;
  website: string;
};

const emptyQuote: QuoteDraft = {
  service: '',
  surface: '',
  frequency: '1 fois par semaine',
  name: '',
  email: '',
  phone: '',
  address: '',
  message: '',
  consent: false,
  website: '',
};

const frequencies = [
  'Quotidien (5j/7)',
  '2 à 3 fois par semaine',
  '1 fois par semaine',
  'Toutes les 2 semaines',
  '1 fois par mois',
  'Intervention unique',
];

const services = [
  {
    title: 'Entretien de vos bureaux',
    image: '/images/bureaux.jpg',
    tone: 'green',
    intro: 'Des espaces de travail propres et accueillants, entretenus selon le rythme de votre entreprise.',
    points: ['Bureaux et espaces de coworking', 'Salles de réunion et espaces communs', 'Sanitaires et consommables', 'Sols, vitres et tri sélectif'],
  },
  {
    title: 'Copropriétés & résidences',
    image: '/images/coproprietes.jpg',
    tone: 'green',
    intro: 'Des prestations régulières adaptées aux usages des résidents et aux besoins de chaque copropriété.',
    points: ['Halls, paliers et cages d’escalier', 'Ascenseurs et surfaces communes', 'Points de contact et locaux à déchets', 'Gestion souple des fréquences'],
  },
  {
    title: 'Nettoyage ponctuel',
    image: '/images/ponctuel.jpg',
    tone: 'magenta',
    intro: 'Une intervention ciblée pour retrouver un espace impeccable au bon moment.',
    points: ['Entrée ou sortie de location', 'Emménagement ou déménagement', 'Événement ou besoin spécifique', 'Vitres et finitions de propreté'],
  },
  {
    title: 'Remise en état',
    image: '/images/remise-en-etat.jpg',
    tone: 'magenta',
    intro: 'Un nettoyage approfondi pour les locaux très encrassés, après travaux ou après une longue période sans entretien.',
    points: ['Décapage et lavage des sols', 'Surfaces, murs et plinthes', 'Cuisines et sanitaires', 'Résidus de chantier et finitions'],
  },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className={`brand ${inverse ? 'brand-inverse' : ''}`} href="#accueil" aria-label="Toul'hygiène - Accueil">
      <span className="brand-name"><b>Toul’</b>hygiène</span>
      <span className="brand-tagline">Nettoyage professionnel éco-responsable</span>
      <img className="brand-leaves" src="/images/feuilles.png" alt="" />
    </a>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label className="field-label" htmlFor={htmlFor}>{children}</label>;
}

export default function Home() {
  const [contactMode, setContactMode] = useState<'devis' | 'candidature'>('devis');
  const [quote, setQuote] = useState<QuoteDraft>({ ...emptyQuote });
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => Promise<object>;
        }, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;

    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: 'prepare_quote_request',
      title: 'Préparer une demande de devis',
      description: 'Ouvre le formulaire de devis Toul’hygiène et le remplit avec les coordonnées, le service et le besoin fournis.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          service: { type: 'string', enum: services.map((service) => service.title) },
          surface: { type: 'string', description: 'Surface approximative en mètres carrés.' },
          frequency: { type: 'string', enum: frequencies },
          phone: { type: 'string', minLength: 8 },
          address: { type: 'string', minLength: 3 },
          message: { type: 'string', minLength: 10 },
        },
        required: ['name', 'email', 'service', 'frequency', 'phone', 'address', 'message'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const draft = input as QuoteDraft;
        if (!draft || typeof draft.name !== 'string' || draft.name.trim().length < 2) throw new Error('Le nom est requis.');
        if (typeof draft.email !== 'string' || !draft.email.includes('@')) throw new Error('Une adresse e-mail valide est requise.');
        if (!services.some((service) => service.title === draft.service)) throw new Error('Le service demandé est inconnu.');
        if (!frequencies.includes(draft.frequency)) throw new Error('La fréquence demandée est inconnue.');
        if (typeof draft.phone !== 'string' || draft.phone.trim().length < 8) throw new Error('Un numéro de téléphone est requis.');
        if (typeof draft.address !== 'string' || draft.address.trim().length < 3) throw new Error('Une ville ou une adresse est requise.');
        if (typeof draft.message !== 'string' || draft.message.trim().length < 10) throw new Error('Décrivez le besoin en au moins 10 caractères.');
        setContactMode('devis');
        setQuote({
          ...emptyQuote,
          name: draft.name.trim(),
          email: draft.email.trim(),
          service: draft.service,
          surface: typeof draft.surface === 'string' ? draft.surface.trim() : '',
          frequency: draft.frequency,
          phone: draft.phone.trim(),
          address: draft.address.trim(),
          message: draft.message.trim(),
        });
        setNoticeType('success');
        setNotice('Votre demande est prête. Vérifiez-la avant de poursuivre.');
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
        return { status: 'prepared', section: 'contact', service: draft.service };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  async function sendQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!quote.consent) {
      setNoticeType('error');
      setNotice('Vous devez accepter d’être recontacté au sujet de votre demande.');
      return;
    }

    setIsSending(true);
    setNotice('');

    try {
      const response = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;

      if (!response.ok || result?.success !== true) {
        throw new Error(result?.message || 'Le service d’envoi est indisponible.');
      }

      setQuote({ ...emptyQuote });
      setNoticeType('success');
      setNotice('Merci, votre demande de devis a bien été envoyée. Nous vous répondrons rapidement.');
    } catch (error) {
      setNoticeType('error');
      setNotice(error instanceof Error ? error.message : 'L’envoi n’a pas abouti. Réessayez ou écrivez à contact@toulhygiene.fr.');
    } finally {
      setIsSending(false);
    }
  }

  function prepareApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoticeType('success');
    setNotice('Votre candidature est prête. L’adresse de réception sera reliée après validation de vos coordonnées de contact.');
  }

  return (
    <main>
      <header className="site-header">
        <Brand />
        <nav aria-label="Navigation principale">
          <a className="active" href="#accueil">Accueil</a><span aria-hidden="true" />
          <a href="#a-propos">À propos</a><span aria-hidden="true" />
          <a href="#services">Nos services</a><span aria-hidden="true" />
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero section-shell" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow">Nettoyage engagé · Toulouse</p>
          <h1>Parce qu’un espace propre ne devrait jamais se faire au détriment de la planète.</h1>
          <a className="primary-cta" href="#contact">Demander un devis <span aria-hidden="true">↗</span></a>
        </div>
        <div className="hero-visual">
          <div className="hero-photo"><img src="/images/toulouse.jpg" alt="Le dôme de la Grave et le pont Saint-Pierre à Toulouse" /></div>
          <span className="orbit orbit-one" aria-hidden="true" /><span className="orbit orbit-two" aria-hidden="true" />
        </div>
        <svg className="scribble-arrow" viewBox="0 0 190 220" aria-hidden="true"><path d="M32 8C-4 77 14 139 81 141c72 2 83-73 30-76-52-3-56 96 37 125" /><path d="m125 168 28 26-37 2" /></svg>
      </section>

      <section className="intro section-shell" aria-labelledby="intro-title">
        <div className="intro-card">
          <p className="section-kicker">Une propreté qui a du sens</p>
          <h2 id="intro-title">Nos services de nettoyage 100% écologiques</h2>
          <p>Nous entretenons vos espaces avec des produits écologiques soigneusement sélectionnés. Nos équipes privilégient le vélo et les transports en commun pour réduire l’empreinte carbone de chaque intervention.</p>
          <a href="#services">Découvrir nos services <span aria-hidden="true">→</span></a>
        </div>
        <div className="intro-note" aria-hidden="true">propre<br />&amp; responsable</div>
      </section>

      <section className="about" id="a-propos">
        <div className="about-image"><img src="/images/chariot-nettoyage.jpg" alt="Chariot de nettoyage dans un espace professionnel lumineux" /></div>
        <div className="about-title section-shell"><span>Qui est</span><strong>Toul’hygiène&nbsp;?</strong></div>
        <div className="about-copy section-shell">
          <div>
            <p className="section-kicker">Le nettoyage responsable à Toulouse</p>
            <h2>Propre dedans.<br /><em>Plus léger dehors.</em></h2>
          </div>
          <div className="about-text">
            <p>Depuis plus de 10 ans, Toul’Hygiène accompagne les professionnels et les particuliers de la région toulousaine avec une conviction simple : offrir une propreté irréprochable tout en respectant l’environnement.</p>
            <p>Notre particularité ? Des produits écologiques choisis pour leur efficacité et leur faible impact sur la planète, afin de préserver la qualité de l’air intérieur et de limiter les substances nocives.</p>
            <p>Notre engagement se prolonge dans nos déplacements : vélo et transports en commun sont privilégiés, les véhicules motorisés restant réservés aux interventions qui le nécessitent.</p>
          </div>
        </div>
        <div className="proof-strip section-shell" aria-label="Nos engagements">
          <div><Leaf aria-hidden="true" /><b>100%</b><span>produits écologiques</span></div>
          <div><Recycle aria-hidden="true" /><b>Mobilité douce</b><span>vélo & transports en commun</span></div>
          <div><Sparkles aria-hidden="true" /><b>10+ ans</b><span>d’expérience à Toulouse</span></div>
        </div>
      </section>

      <section className="story" aria-labelledby="story-title">
        <div className="story-inner section-shell">
          <div className="story-copy">
            <p className="section-kicker light">Notre histoire</p>
            <h2 id="story-title">À l’origine de cette initiative…</h2>
            <p>Toul’Hygiène est née de l’initiative de Pauline et Lucas, un jeune couple diplômé de Master et passionné par l’entrepreneuriat. Sensibles aux enjeux environnementaux et aux nouvelles attentes des entreprises en matière de RSE, ils ont imaginé une société capable d’allier efficacité, qualité de service et respect de la planète.</p>
            <p className="story-highlight">Leur ambition : maintenir des locaux impeccables tout en renforçant l’engagement environnemental de leurs clients.</p>
          </div>
          <div className="story-mark" aria-hidden="true">
            <div className="story-leaf"><img src="/images/feuilles.png" alt="" /></div>
            <p>Une approche locale,<br />humaine et durable.</p>
          </div>
        </div>
      </section>

      <section className="services section-shell" id="services" aria-labelledby="services-title">
        <div className="section-heading">
          <div><p className="section-kicker">Ce que nous faisons</p><h2 id="services-title">Des prestations pensées pour vos espaces</h2></div>
          <p>Régulier ou ponctuel, chaque entretien est adapté à vos contraintes, à vos usages et au rythme de vos lieux.</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <article className={`service-card ${service.tone}`} key={service.title}>
              <div className="service-photo"><img src={service.image} alt="" /></div>
              <div className="service-number" aria-hidden="true">0{index + 1}</div>
              <h3>{service.title}</h3>
              <p>{service.intro}</p>
              <ul>{service.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
              <a href="#contact">Parler de votre besoin <ArrowRight aria-hidden="true" /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div className="contact-inner section-shell">
          <div className="contact-intro">
            <p className="section-kicker light">Parlons de vos espaces</p>
            <h2 id="contact-title">Un besoin de nettoyage&nbsp;?</h2>
            <p>Décrivez vos espaces et le rythme souhaité. Nous reviendrons vers vous pour préciser l’intervention et préparer votre devis.</p>
            <div className="contact-reassurance"><Check aria-hidden="true" /><span>Réponse personnalisée</span><Check aria-hidden="true" /><span>Intervention à Toulouse et alentours</span></div>
          </div>
          <Tabs value={contactMode} onValueChange={(value) => { setContactMode(value as 'devis' | 'candidature'); setNotice(''); }} className="contact-tabs">
            <TabsList className="contact-tabs-list" aria-label="Type de demande">
              <TabsTrigger value="devis">Demande de devis</TabsTrigger>
              <TabsTrigger value="candidature">Nous rejoindre</TabsTrigger>
            </TabsList>
            <TabsContent value="devis" className="contact-panel">
              <div className="quote-form-header">
                <span><Send aria-hidden="true" /></span>
                <div><h3>Formulaire de demande de devis</h3><p>Quelques précisions nous permettront de préparer une estimation adaptée à vos espaces.</p></div>
              </div>
              <form onSubmit={sendQuote} aria-busy={isSending}>
                <div className="form-grid">
                  <div className="full"><FieldLabel htmlFor="quote-service">Type de prestation souhaité *</FieldLabel><Select value={quote.service} onValueChange={(value) => setQuote({ ...quote, service: value ?? '' })} required><SelectTrigger id="quote-service"><SelectValue placeholder="Sélectionnez un service…" /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{services.map((service) => <SelectItem key={service.title} value={service.title}>{service.title}</SelectItem>)}</SelectContent></Select></div>
                  <div><FieldLabel htmlFor="quote-surface">Surface approximative (m²)</FieldLabel><Input id="quote-surface" type="number" inputMode="decimal" min="1" max="100000" value={quote.surface} onChange={(event) => setQuote({ ...quote, surface: event.target.value })} placeholder="Ex. : 150" /></div>
                  <div><FieldLabel htmlFor="quote-frequency">Fréquence souhaitée *</FieldLabel><Select value={quote.frequency} onValueChange={(value) => setQuote({ ...quote, frequency: value ?? '' })} required><SelectTrigger id="quote-frequency"><SelectValue placeholder="Choisir une fréquence" /></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{frequencies.map((frequency) => <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>)}</SelectContent></Select></div>
                  <div><FieldLabel htmlFor="quote-name">Nom complet / Entreprise *</FieldLabel><Input id="quote-name" name="name" autoComplete="name" required value={quote.name} onChange={(event) => setQuote({ ...quote, name: event.target.value })} placeholder="Pauline Dupont" /></div>
                  <div><FieldLabel htmlFor="quote-email">Adresse e-mail *</FieldLabel><Input id="quote-email" name="email" type="email" autoComplete="email" required value={quote.email} onChange={(event) => setQuote({ ...quote, email: event.target.value })} placeholder="contact@entreprise.com" /></div>
                  <div><FieldLabel htmlFor="quote-phone">Numéro de téléphone *</FieldLabel><Input id="quote-phone" name="tel" type="tel" autoComplete="tel" required minLength={8} value={quote.phone} onChange={(event) => setQuote({ ...quote, phone: event.target.value })} placeholder="06 12 34 56 78" /></div>
                  <div><FieldLabel htmlFor="quote-address">Ville / Adresse à Toulouse *</FieldLabel><Input id="quote-address" name="street-address" autoComplete="street-address" required value={quote.address} onChange={(event) => setQuote({ ...quote, address: event.target.value })} placeholder="Toulouse Centre, Capitole, Compans…" /></div>
                  <div className="full"><FieldLabel htmlFor="quote-message">Détails ou précisions particulières *</FieldLabel><Textarea id="quote-message" required minLength={10} maxLength={2500} value={quote.message} onChange={(event) => setQuote({ ...quote, message: event.target.value })} placeholder="Configuration des lieux, horaires souhaités, contraintes d’accès…" /></div>
                  <div className="form-trap" aria-hidden="true"><FieldLabel htmlFor="quote-website">Votre site web</FieldLabel><Input id="quote-website" tabIndex={-1} autoComplete="off" value={quote.website} onChange={(event) => setQuote({ ...quote, website: event.target.value })} /></div>
                  <div className="form-consent full">
                    <Checkbox id="quote-consent" required checked={quote.consent} onCheckedChange={(checked) => setQuote({ ...quote, consent: checked })} />
                    <label htmlFor="quote-consent">J’accepte que Toul’hygiène me recontacte au sujet de ma demande de devis. *</label>
                  </div>
                </div>
                <Button type="submit" size="lg" className="form-submit" disabled={isSending}>
                  {isSending ? <><LoaderCircle className="submit-spinner" aria-hidden="true" />Envoi en cours…</> : <><Send aria-hidden="true" />Envoyer ma demande de devis</>}
                </Button>
                <p className="form-footnote">Votre demande sera envoyée à contact@toulhygiene.fr. Les champs marqués d’un * sont obligatoires.</p>
              </form>
            </TabsContent>
            <TabsContent value="candidature" className="contact-panel">
              <form onSubmit={prepareApplication}>
                <div className="form-grid">
                  <div><FieldLabel htmlFor="candidate-name">Nom complet</FieldLabel><Input id="candidate-name" required placeholder="Votre nom" /></div>
                  <div><FieldLabel htmlFor="candidate-email">E-mail</FieldLabel><Input id="candidate-email" type="email" required placeholder="vous@exemple.fr" /></div>
                  <div className="full"><FieldLabel htmlFor="candidate-message">Votre message</FieldLabel><Textarea id="candidate-message" required minLength={10} placeholder="Présentez-nous votre parcours et vos disponibilités…" /></div>
                  <div className="full"><FieldLabel htmlFor="candidate-cv">CV</FieldLabel><Input id="candidate-cv" type="file" accept=".pdf,.doc,.docx" /></div>
                </div>
                <Button type="submit" size="lg" className="form-submit">Préparer ma candidature <ArrowRight aria-hidden="true" /></Button>
              </form>
            </TabsContent>
            {notice && <output className={`form-notice ${noticeType}`} aria-live="polite">{noticeType === 'error' ? <TriangleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}{notice}</output>}
          </Tabs>
        </div>
      </section>

      <footer>
        <div className="footer-inner section-shell"><Brand inverse /><p>Nettoyage professionnel éco-responsable · Toulouse</p><a href="#accueil">Retour en haut ↑</a></div>
      </footer>
    </main>
  );
}
