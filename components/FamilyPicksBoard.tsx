import type { FamilyPicksEntry } from "@/lib/family-picks";
import type { Match } from "@/lib/types";
import { useState } from "react";

type Props = {
  entries: FamilyPicksEntry[];
  matches: Match[];
};

const COMMENTARY = [
  "You just rawdogged the worst possible option.",
  "Esa elección claramente necesita un adulto responsable.",
  "A pick made with impressive confidence and limited evidence.",
  "Qué puta mierda de elección.",
  "The committee has reviewed this and chosen to tell you to fuck off.",
  "Básicamente acabas de cagar todo el bracket con un solo click.",
  "This has strong 'guy who loses his kid's college fund' energy.",
  "Tu bracket acaba de pedir espacio para procesar esta cagada.",
  "Mathematically possible, emotionally suspect, entirely dogshit.",
  "Si la pendejez volara, tú serías el puto aeropuerto internacional.",
  "A pick so bad it warrants a public, tearful apology.",
  "Esa predicción tiene antecedentes penales.",
  "That pick smells like deep, unresolved family trauma.",
  "El grupo familiar merece una disculpa formal por esto.",
  "Several ancestors just looked away in pure disgust.",
  "La calculadora se negó a participar en esta mamada.",
  "Your bracket is now under federal investigation.",
  "Ni estando hasta la madre de pedo se justifica esta pendejada.",
  "That should have stayed a private, shameful thought.",
  "Tus pronósticos valen exactamente tres hectáreas de verga.",
  "A very loud way to announce you're a fucking moron.",
  "Quien te enseñó de deportes merece una buena verguiza.",
  "Chosen with the calmness of a man bleeding out.",
  "Esa elección es una patada directa en los huevos a la lógica.",
  "That pick arrived smelling like cheap booze and bad credit.",
  "Eres un puto terrorista de las estadísticas.",
  "A decision made entirely divorced from fucking reality.",
  "Acabas de tirar tu dinero a la basura, cabrón.",
  "Interesting. In the 'you need a psych evaluation' sense.",
  "Hasta un ciego hubiera visto que esa era una soberana mamada.",
  "That pick has major parole violation energy.",
  "Tus neuronas claramente están en huelga sindical.",
  "Your confidence is doing a lot of heavy lifting for your absolute lack of brains.",
  "Qué pinche vergüenza ajena da ver tu bracket.",
  "The numbers do not support this reckless fucking lifestyle.",
  "Elegiste con el puto culo, felicidades.",
  "A pick entirely devoid of adult supervision.",
  "Esta madre es un insulto directo al sentido común.",
  "The bracket heard you and immediately died.",
  "Seguramente estabas cagando cuando tomaste esta decisión financiera.",
  "That one came directly from the gut, which is full of shit.",
  "Te mamaste con esta estupidez olímpica.",
  "I've seen better decisions made in Denny's parking lots at 3 AM.",
  "Apostar a esta madre es de putos enfermos mentales.",
  "You're going to lose real money on this absolute garbage.",
  "No mames, hasta mi abuela muerta tiene mejores picks.",
  "Whoever let you cook needs to be fucking arrested.",
  "Este bracket ya se fue a la reputísima madre que lo parió.",
  "This pick is the reason your parents change the subject when you come up.",
  "Claramente tienes aserrín y mierda en lugar de cerebro.",
  "A truly stunning display of profound brain damage.",
  "Una decisión digna de un reverendo pendejo.",
  "That selection is a literal hate crime against statistics.",
  "Qué puto asco de pronóstico, de verdad.",
  "Fucking atrocious. I love it.",
  "Esa mamada ni tú te la crees estando sobrio.",
  "The math here requires you to be a complete dumbass.",
  "Tus decisiones me dan úlceras sangrantes.",
  "I hope to god you didn't pay to enter this pool.",
  "Este pick es la definición de valer pura madre.",
  "Just rip up the bracket and go fuck yourself.",
  "Esa es una pendejada de proporciones bíblicas.",
  "You clearly drafted this while taking a painful shit.",
  "Vete a la verga con tu optimismo sin fundamentos.",
  "This is the pick of a man who eats dry wall for breakfast.",
  "Tiraste el bracket al puto caño con esta estupidez.",
  "I'm billing you for the brain cells I lost reading that.",
  "Tus pronósticos huelen a cruda de tequila barato.",
  "God abandoned us, and this pick is the proof.",
  "Esa decisión la tomaste con las nalgas.",
  "An absolutely unhinged piece of shit prediction.",
  "Este pick es para cortarse los putos huevos con galletas marías.",
  "You possess the analytical skills of a fucking concussed toddler.",
  "Parece que armaste esta madre inhalando resistol 5000.",
  "This bracket is asking for a restraining order against you.",
  "Tienes el cerebro de un puto mosquito desnutrido.",
  "We are all significantly dumber for having witnessed this bullshit.",
  "Esta decisión grita 'no me llega agua al puto tanque'.",
  "Pure, weaponized stupidity on display.",
  "El silencio del chat es porque todos piensan que eres pendejo.",
  "Throwing a dart at a board of dog shit would yield better results.",
  "Tu exceso de confianza es pura pinche ignorancia.",
  "This pick makes me want to walk directly into the ocean.",
  "Una decisión hecha con los ojos vendados y el cerebro apagado.",
  "You really looked at the data and said 'fuck it'.",
  "Eso huele a apuesta de compadre borracho.",
  "A catastrophic failure of human intelligence.",
  "Elegido con mucha fe y cero puta evidencia.",
  "This is exactly why we shouldn't let everyone vote.",
  "Metiste tus putos sentimientos donde iba la estrategia.",
  "Someone take the keyboard away from this absolute clown.",
  "Valiente. Y también estúpidamente preocupante.",
  "You are statistically a fucking idiot.",
  "This pick has major 'I just shit my pants' energy.",
  "Even a blind monkey would have avoided that disaster.",
  "I would rather staple my balls to a desk than back that pick.",
  "You're drafting like someone who huffs paint in their garage.",
  "A phenomenally dogshit choice.",
  "This bracket looks like a fucking crime scene.",
  "Your entire fucking logic process is broken.",
  "This is the exact moment your bracket flatlined.",
  "You really stepped in massive shit with this one.",
  "Absolute fucking clown shoes.",
  "I'm amazed you remember to breathe with decision-making like this.",
  "Brought to you by severe head trauma.",
  "You just alienated everyone in the group chat with that bullshit.",
  "Total fucking amateur hour.",
  "I've taken dumps with more strategic value than this pick."
];

function pickComment(displayName: string, matchId: string, winner: string) {
  const seed = `${displayName}-${matchId}-${winner}`;
  const total = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return COMMENTARY[total % COMMENTARY.length];
}

export default function FamilyPicksBoard({ entries, matches }: Props) {
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const activeEntries = entries.filter((entry) => entry.picks.length > 0);
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="emptyState">
        <h3>No one else has joined yet.</h3>
        <p>The family is currently undefeated at avoiding accountability.</p>
      </div>
    );
  }

  if (activeEntries.length === 0) {
    return (
      <div className="emptyState">
        <h3>No picks from anyone else yet.</h3>
        <p>A rare moment where nobody is wrong. Deeply temporary.</p>
      </div>
    );
  }

  return (
  <div className="familyPicksBoard">
    {activeEntries.map((entry, entryIndex) => {
      const personKey = `${entry.displayName}-${entryIndex}`;
      const isOpen = openPerson === personKey;

      return (
        <section className="familyPickPerson" key={personKey}>
          <button
            type="button"
            className="familyPickHeader"
            onClick={() => setOpenPerson(isOpen ? null : personKey)}
          >
            <h3>{entry.displayName}</h3>
            <span>{entry.picks.length} picks</span>
          </button>

          {isOpen && (
            <div className="familyPickList">
              {entry.picks.map((pick, pickIndex) => {
                const match = matchesById.get(pick.matchId);

                return (
                  <article
                    className="familyPickCard"
                    key={`${entry.displayName}-${pick.matchId}-${pickIndex}`}
                  >
                    <div>
                      <span className="familyPickMatch">
                        {match ? `${match.homeTeam} vs ${match.awayTeam}` : "Unknown match"}
                      </span>

                      {match && (
                        <span className="familyPickMeta">
                          {match.dateLabel} · {match.kickoff}
                        </span>
                      )}
                    </div>

                    <strong>{pick.winner}</strong>
                    <p>{pickComment(entry.displayName, pick.matchId, pick.winner)}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      );
    })}
  </div>
);
}
