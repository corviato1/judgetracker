const quizQuestions = [
  {
    id: "q1",
    title: "Protest and public safety",
    scenario:
      "A city issues a permit for a large protest in a downtown area. The organizers plan to block a major street, and the city worries about emergency vehicle access. The protest group sues when the city restricts the route and imposes time limits.",
    answers: [
      {
        id: "q1a",
        label: "Protect protest as broadly as possible",
        description:
          "Allow the march on the main route with minimal restrictions, requiring only clear emergency lanes and basic safety plans.",
        // skews toward appellate / rights-focused judge (id 2),
        // with some alignment to the more speech-protective district judge (id 1)
        weights: { 2: 2, 1: 1 },
      },
      {
        id: "q1b",
        label: "Balanced restrictions",
        description:
          "Uphold the city’s time and route limits as long as they are content-neutral and leave open other ways to speak.",
        // balanced: all judges get some credit
        weights: { 1: 1, 2: 1, 3: 1 },
      },
      {
        id: "q1c",
        label: "Defer strongly to public safety",
        description:
          "Give the city broad leeway to limit the route and timing in the name of public safety, even if it narrows visibility.",
        // more aligned with a cautious state high court style (id 3)
        weights: { 3: 2, 1: 1 },
      },
    ],
  },
  {
    id: "q2",
    title: "Tech platform and harassment",
    scenario:
      "Users on a large online platform coordinate harassment of an individual, including doxxing and threats. The victim sues the platform, arguing it failed to enforce its own rules. The platform claims immunity as an online intermediary.",
    answers: [
      {
        id: "q2a",
        label: "Aggressively hold the platform accountable",
        description:
          "Narrow immunity and allow the case to proceed, emphasizing the platform’s active role in amplifying harassment.",
        weights: { 1: 2, 3: 1 },
      },
      {
        id: "q2b",
        label: "Follow precedent and keep broad immunity",
        description:
          "Dismiss the case, recognizing that changes to platform liability should primarily come from the legislature.",
        weights: { 2: 2 },
      },
      {
        id: "q2c",
        label: "Let part of the case go forward",
        description:
          "Preserve some claims where the platform’s own conduct goes beyond neutral hosting, but dismiss others.",
        weights: { 1: 1, 2: 1, 3: 1 },
      },
    ],
  },
  {
    id: "q3",
    title: "Criminal sentencing and prior record",
    scenario:
      "A defendant with a non-violent prior record is convicted of a new non-violent offense. The guidelines recommend a significant prison term. The law allows limited downward departures.",
    answers: [
      {
        id: "q3a",
        label: "Strict guidelines",
        description:
          "Stay close to the recommended guideline sentence, emphasizing consistency and deference to legislative policy.",
        weights: { 3: 2, 2: 1 },
      },
      {
        id: "q3b",
        label: "Moderate reduction",
        description:
          "Apply a modest downward departure where the law allows it, focusing on rehabilitation and proportionality.",
        weights: { 1: 2, 3: 1 },
      },
      {
        id: "q3c",
        label: "Significant downward departure",
        description:
          "Use every lawful tool to reduce the sentence substantially, emphasizing individual circumstances and future risk.",
        weights: { 1: 2 },
      },
    ],
  },
  {
    id: "q4",
    title: "Small business versus zoning board",
    scenario:
      "A small business sues a local zoning board after being denied a permit. The board followed its written standards but applied them more strictly to this business than to some larger local companies in similar situations.",
    answers: [
      {
        id: "q4a",
        label: "Strongly side with the business",
        description:
          "Find that the uneven enforcement violates equal protection or due process and order the permit to be granted.",
        weights: { 1: 2 },
      },
      {
        id: "q4b",
        label: "Remand for a clearer record",
        description:
          "Send the case back for further fact-finding and a clearer explanation from the board before deciding the legal issue.",
        weights: { 2: 2 },
      },
      {
        id: "q4c",
        label: "Defer to the zoning board",
        description:
          "Uphold the board’s decision unless there is very strong evidence of intentional discrimination or illegitimate motive.",
        weights: { 3: 2 },
      },
    ],
  },
  {
    id: "q5",
    title: "State constitutional rights vs federal baseline",
    scenario:
      "A state constitution uses broader language than the federal constitution on search and seizure. A defendant argues that the state charter should provide more protection than the federal baseline in a digital privacy case.",
    answers: [
      {
        id: "q5a",
        label: "Expand rights under state law",
        description:
          "Interpret the state constitution as more protective in the digital context, even if the federal baseline is lower.",
        weights: { 3: 2, 1: 1 },
      },
      {
        id: "q5b",
        label: "Track the federal standard for now",
        description:
          "Keep the state standard aligned with federal law absent a clear historical or textual basis to diverge.",
        weights: { 2: 2 },
      },
      {
        id: "q5c",
        label: "Case-by-case divergence",
        description:
          "Recognize that state rights can be broader, but limit expansions to narrow, clearly defined scenarios.",
        weights: { 1: 1, 2: 1, 3: 1 },
      },
    ],
  },
];

export default quizQuestions;
