const quizQuestions = [
  // ─── Section 1: Interpreting the law ────────────────────────────────────────
  {
    id: "q1",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "Stare decisis and when to overturn precedent",
    scenario:
      "A 35-year-old Supreme Court ruling expanded a statutory right in a way critics argue has no basis in the statute's text. Subsequent courts have not built heavily on it, and the original dissenters said it had no textual grounding. A party now asks the court to formally overrule the decision.",
    answers: [
      {
        id: "q1a",
        label: "Overturn it — wrong when decided, still wrong now",
        description:
          "Stare decisis does not require courts to perpetuate errors. Correcting a wrongly reasoned decision strengthens the law's integrity more than false consistency ever could.",
        weights: { 2: 2, 4: 3 },
      },
      {
        id: "q1b",
        label: "Preserve it — stability outweighs re-examination",
        description:
          "Even imperfect precedent creates predictability that the legal system depends on. Courts should not overturn long-settled law simply because a current majority would decide differently.",
        weights: { 5: 3, 3: 1 },
      },
      {
        id: "q1c",
        label: "Narrow it without formally overruling",
        description:
          "Limit the precedent to its specific facts so it can cause no further harm, while leaving the formal question of overruling to a case that squarely demands it.",
        weights: { 5: 2, 3: 2, 1: 1 },
      },
    ],
  },
  {
    id: "q2",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "State constitutional rights versus the federal baseline",
    scenario:
      "A state constitution uses broader language than the federal constitution on search and seizure. A defendant argues that the state charter should provide more protection than the federal baseline in a digital privacy case involving data from a smartphone.",
    answers: [
      {
        id: "q2a",
        label: "Expand rights under state law",
        description:
          "Interpret the state constitution as more protective in the digital context, even if the federal baseline is lower. States are free to give their residents stronger protections.",
        weights: { 1: 2, 3: 2, 5: 1 },
      },
      {
        id: "q2b",
        label: "Track the federal standard",
        description:
          "Keep the state standard aligned with federal law absent a clear historical or textual basis to diverge. Uniform standards reduce confusion and promote predictability.",
        weights: { 2: 2, 4: 2 },
      },
      {
        id: "q2c",
        label: "Case-by-case divergence only where clearly justified",
        description:
          "Recognize that state rights can be broader, but limit expansions to situations with clear textual or historical grounding in the specific state charter.",
        weights: { 3: 2, 5: 2 },
      },
    ],
  },
  {
    id: "q3",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "Online platform liability",
    scenario:
      "Users on a large social platform coordinate harassment of an individual, including doxxing and threats. The victim sues the platform, arguing it failed to enforce its own safety rules. The platform claims broad immunity as an online intermediary under federal law.",
    answers: [
      {
        id: "q3a",
        label: "Narrow immunity and let the case proceed",
        description:
          "The platform's active role in amplifying harmful content goes beyond neutral hosting. Immunity was never meant to shield platforms that knowingly facilitate coordinated harassment.",
        weights: { 1: 2, 3: 1 },
      },
      {
        id: "q3b",
        label: "Uphold broad immunity as written",
        description:
          "The statute clearly grants this immunity. If Congress thinks the law needs reform, it can change it — courts should not rewrite plain statutory text to reach preferred outcomes.",
        weights: { 2: 3, 4: 1 },
      },
      {
        id: "q3c",
        label: "Let some claims survive on narrower grounds",
        description:
          "Preserve the specific claims tied to the platform's own algorithmic promotion of the harassment, but dismiss broader theories that would swallow the immunity rule entirely.",
        weights: { 3: 2, 5: 2 },
      },
    ],
  },
  {
    id: "q4",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "Digital privacy and law enforcement access",
    scenario:
      "Law enforcement obtains six months of cell phone location data directly from a carrier without a warrant, arguing that records voluntarily shared with a third party lose Fourth Amendment protection. The suspect argues that long-term digital location tracking is categorically different from older third-party precedents.",
    answers: [
      {
        id: "q4a",
        label: "The Fourth Amendment covers digital location data — warrant required",
        description:
          "The volume and intimacy of long-term location records means people retain a reasonable expectation of privacy in them, whatever the older third-party doctrine once said. Technology changes the constitutional analysis.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q4b",
        label: "Third-party doctrine applies — no warrant needed",
        description:
          "When people voluntarily share data with carriers, they assume the risk it will be disclosed. This constitutional rule has been settled for decades and should not be rewritten by courts.",
        weights: { 2: 2, 4: 2 },
      },
      {
        id: "q4c",
        label: "Require a warrant only for extended surveillance — decide narrowly",
        description:
          "Short-term records may remain unprotected under existing doctrine, but sustained tracking over months crosses a constitutional threshold. Decide no more than that specific question.",
        weights: { 5: 3, 3: 1 },
      },
    ],
  },

  // ─── Section 2: Criminal justice ────────────────────────────────────────────
  {
    id: "q5",
    section: "criminal-justice",
    sectionLabel: "Criminal justice",
    title: "Sentencing and the guidelines",
    scenario:
      "A defendant with a non-violent prior record is convicted of a new non-violent drug offense. The federal sentencing guidelines recommend a substantial prison term. The law permits limited downward departures based on individual circumstances.",
    answers: [
      {
        id: "q5a",
        label: "Stay close to the guideline sentence",
        description:
          "Guidelines exist for consistency and to reflect Congress's sentencing policy. Judges who routinely depart undermine uniform treatment and legislative intent.",
        weights: { 2: 2, 4: 2, 5: 1 },
      },
      {
        id: "q5b",
        label: "Apply a modest downward departure",
        description:
          "The guidelines are a starting point, not a ceiling. A proportionate reduction that accounts for rehabilitation prospects and individual background is both lawful and appropriate.",
        weights: { 1: 2, 3: 2 },
      },
      {
        id: "q5c",
        label: "Use every lawful tool to reduce the sentence",
        description:
          "Mandatory-adjacent sentences for non-violent offenses do more harm than good. Judges should exercise the full scope of their discretion to impose a sentence that fits this person.",
        weights: { 1: 3 },
      },
    ],
  },
  {
    id: "q6",
    section: "criminal-justice",
    sectionLabel: "Criminal justice",
    title: "Habeas corpus and new evidence",
    scenario:
      "A prisoner files a habeas petition arguing that new DNA evidence — technology that did not exist at the time of trial — strongly suggests innocence. Federal procedural rules required such claims to be filed within one year of conviction, a deadline that passed before the science was available.",
    answers: [
      {
        id: "q6a",
        label: "Allow the petition — no deadline bars a credible innocence claim",
        description:
          "Procedural rules are tools for efficiency, not traps for the actually innocent. A credible claim of innocence supported by genuinely new science should always reach the merits.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q6b",
        label: "Apply the deadline — Congress set those limits",
        description:
          "Habeas review has statutory limits that courts must enforce. Courts that ignore statutes they find inconvenient undermine the rule of law and separation of powers.",
        weights: { 2: 3, 4: 1 },
      },
      {
        id: "q6c",
        label: "Recognize a narrow equitable exception for unavailable science",
        description:
          "Equity tolls deadlines when compliance was objectively impossible. Create a limited exception for newly available forensic technology, deciding only this case's specific facts.",
        weights: { 5: 3, 3: 1 },
      },
    ],
  },
  {
    id: "q7",
    section: "criminal-justice",
    sectionLabel: "Criminal justice",
    title: "Qualified immunity for use of force",
    scenario:
      "A police officer used force that seriously injured a suspect in a situation where no prior court decision had addressed exactly these facts. The officer claims qualified immunity because the right was not 'clearly established.' In hindsight, most observers agree the force was excessive.",
    answers: [
      {
        id: "q7a",
        label: "Deny immunity — the constitutional rule was clear enough",
        description:
          "The right to be free from excessive force does not require a case with identical facts. Requiring exact precedent insulates officers from accountability for obvious violations.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q7b",
        label: "Grant immunity — precedent requires a close factual match",
        description:
          "The doctrine as written requires that a prior case give fair warning that this specific conduct was unlawful. Courts should apply the law as it exists, not as critics wish it were.",
        weights: { 2: 2, 4: 2 },
      },
      {
        id: "q7c",
        label: "Reframe the test around what a reasonable officer would know",
        description:
          "Rather than hunting for an identical prior case, ask whether a reasonable officer would have known this force was unconstitutional. That standard better tracks the doctrine's purpose.",
        weights: { 3: 3, 5: 2 },
      },
    ],
  },
  {
    id: "q8",
    section: "criminal-justice",
    sectionLabel: "Criminal justice",
    title: "Capital punishment and cruel punishment",
    scenario:
      "A state uses a drug protocol for executions that some studies link to a risk of severe pain during the process. The prisoner challenging the method cannot identify a clearly available alternative. The state argues this is the most humane method it can access, and that the Constitution permits capital punishment.",
    answers: [
      {
        id: "q8a",
        label: "Prohibit it — the risk of severe pain is enough",
        description:
          "The Eighth Amendment bars methods that create a substantial risk of serious harm during execution. The state cannot insulate its protocol from review simply because the prisoner cannot name a better alternative.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q8b",
        label: "Allow it — the Constitution permits capital punishment",
        description:
          "The text and history of the Eighth Amendment clearly contemplate capital punishment. States that follow established procedure and use the best method available satisfy the constitutional standard.",
        weights: { 4: 3, 2: 2 },
      },
      {
        id: "q8c",
        label: "Require specific comparative evidence of unnecessary pain",
        description:
          "The challenger must show both a substantial risk and a known, available alternative that meaningfully reduces it. Demand a more developed factual record before ruling either way.",
        weights: { 5: 3, 3: 1 },
      },
    ],
  },

  // ─── Section 3: Government power ────────────────────────────────────────────
  {
    id: "q9",
    section: "government-power",
    sectionLabel: "Government power",
    title: "Agency regulatory authority",
    scenario:
      "A federal agency interprets a statute it administers to cover a new category of businesses that were not explicitly mentioned when the law was passed. The agency's reading is plausible but not the only one possible. A trade group challenges the rule in court.",
    answers: [
      {
        id: "q9a",
        label: "Defer to the agency's reasonable interpretation",
        description:
          "Congress delegated broad authority to this agency. When a statute is ambiguous, the agency with expertise and democratic accountability through the executive should fill the gap.",
        weights: { 3: 2, 1: 1 },
      },
      {
        id: "q9b",
        label: "Courts decide what statutes mean — no deference",
        description:
          "Statutory interpretation is a core judicial function. Agencies have no special authority to expand their own power by choosing among plausible readings of an ambiguous law.",
        weights: { 2: 3, 4: 2 },
      },
      {
        id: "q9c",
        label: "Give the agency some weight but decide independently",
        description:
          "Agency expertise deserves consideration as persuasive authority, but courts must reach their own conclusion on what the law means rather than simply deferring to the regulated party's enforcer.",
        weights: { 5: 3, 3: 1 },
      },
    ],
  },
  {
    id: "q10",
    section: "government-power",
    sectionLabel: "Government power",
    title: "Executive privilege versus congressional oversight",
    scenario:
      "A congressional committee subpoenas internal White House communications about a significant domestic policy decision. The executive branch asserts absolute privilege over all internal deliberative materials. Congress argues it cannot conduct meaningful oversight without these documents.",
    answers: [
      {
        id: "q10a",
        label: "Congressional oversight generally prevails",
        description:
          "Privilege is real but not absolute. When Congress demonstrates a specific legislative need, the scales tip toward disclosure — especially for non-national-security policy matters.",
        weights: { 1: 2, 3: 1, 5: 1 },
      },
      {
        id: "q10b",
        label: "Broad executive privilege protects internal deliberations",
        description:
          "Effective executive branch decision-making requires candid internal deliberation. Separation of powers demands that one branch not rummage through another's internal workings.",
        weights: { 4: 3, 2: 1 },
      },
      {
        id: "q10c",
        label: "Review documents in camera and balance case by case",
        description:
          "Neither branch has absolute authority. Review the contested documents privately, assess each item's sensitivity against Congress's demonstrated need, and produce a tailored order.",
        weights: { 3: 3, 5: 2 },
      },
    ],
  },
  {
    id: "q11",
    section: "government-power",
    sectionLabel: "Government power",
    title: "Second Amendment and public carry",
    scenario:
      "A city prohibits carrying handguns in public parks, citing public safety concerns about crowded spaces. A gun rights group challenges the law, arguing the Second Amendment extends beyond the home and that historical tradition at the founding supports the right to carry in public for self-defense.",
    answers: [
      {
        id: "q11a",
        label: "Strike the restriction — the Second Amendment covers public carry",
        description:
          "Historical tradition at ratification supports carrying arms for self-defense in public. When the text and history are clear, modern policy preferences cannot override the constitutional guarantee.",
        weights: { 4: 3, 2: 2 },
      },
      {
        id: "q11b",
        label: "Uphold it — legislatures may regulate public spaces",
        description:
          "Even if the Second Amendment has some public application, legislatures retain authority to regulate the manner of carrying in sensitive locations like parks. Public safety is a legitimate interest.",
        weights: { 1: 2, 3: 2 },
      },
      {
        id: "q11c",
        label: "Apply the historical tradition test narrowly to this specific location",
        description:
          "The constitutional question turns on whether historical analogues for restricting carry in park-like spaces existed at the founding. Assess that record carefully and decide only whether this park ban survives that test.",
        weights: { 5: 3, 4: 1 },
      },
    ],
  },
  {
    id: "q12",
    section: "government-power",
    sectionLabel: "Government power",
    title: "Small business versus the zoning board",
    scenario:
      "A small business sues a local zoning board after being denied a permit. The board followed its written standards but applied them more strictly to this business than to several larger companies in similar situations over the past two years.",
    answers: [
      {
        id: "q12a",
        label: "Side with the business — uneven enforcement is unlawful",
        description:
          "Applying the same rules more harshly to smaller or less connected businesses violates equal protection and due process. Courts exist precisely to catch this kind of quiet discrimination.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q12b",
        label: "Remand for a fuller record",
        description:
          "The differences in treatment may have legitimate explanations. Send the case back for a clearer factual record and a more thorough explanation from the board before resolving the legal question.",
        weights: { 5: 2, 3: 2 },
      },
      {
        id: "q12c",
        label: "Defer to the board unless discrimination is clearly proved",
        description:
          "Local land-use decisions belong to local bodies with community knowledge. Courts should not substitute their judgment for the board's unless intentional discrimination is demonstrated by strong evidence.",
        weights: { 2: 2, 4: 2 },
      },
    ],
  },

  // ─── Section 4: Rights and society ──────────────────────────────────────────
  {
    id: "q13",
    section: "rights-society",
    sectionLabel: "Rights and society",
    title: "Protest and public safety",
    scenario:
      "A city issues a permit for a large protest in downtown. The organizers plan to march on the main commercial street; the city worries about emergency vehicle access and imposes a detour route and time limits. The organizers sue, arguing the restrictions are unconstitutional.",
    answers: [
      {
        id: "q13a",
        label: "Protect the protest as broadly as possible",
        description:
          "The main route is the expressive choice. Restrictions that dilute the message's visibility need a strong justification, and convenience for the city does not supply one.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q13b",
        label: "Uphold content-neutral restrictions that leave other options open",
        description:
          "Cities may impose reasonable time, place, and manner limits without violating the First Amendment, as long as the rules are content-neutral and alternative channels of expression remain available.",
        weights: { 2: 2, 4: 1, 5: 1 },
      },
      {
        id: "q13c",
        label: "Defer broadly to public safety judgment",
        description:
          "Emergency response is a compelling interest. Where a city has identified genuine access concerns, courts should give substantial deference to route and timing decisions made by officials on the ground.",
        weights: { 3: 2, 4: 1 },
      },
    ],
  },
  {
    id: "q14",
    section: "rights-society",
    sectionLabel: "Rights and society",
    title: "Religious liberty versus anti-discrimination law",
    scenario:
      "A small business owner declines to provide custom services for a same-sex wedding, citing sincere religious objections. A state public accommodations law prohibits discrimination based on sexual orientation. Both parties claim constitutional protection.",
    answers: [
      {
        id: "q14a",
        label: "Side with the business — religious liberty requires an exemption",
        description:
          "Compelling someone to create expressive content that contradicts their religious beliefs violates the First Amendment's protection of both free exercise and free speech. Exemptions are required.",
        weights: { 4: 3, 2: 1 },
      },
      {
        id: "q14b",
        label: "Side with equal access — anti-discrimination law applies neutrally",
        description:
          "A generally applicable, neutral law that prohibits discrimination in public commerce does not violate religious liberty, even when believers object. Civil rights laws apply to everyone equally.",
        weights: { 1: 2, 3: 1, 5: 1 },
      },
      {
        id: "q14c",
        label: "Require a narrow accommodation before compelling participation",
        description:
          "The state must demonstrate that no less restrictive alternative — such as connecting the couple with willing vendors — is available before ordering the business owner to participate.",
        weights: { 5: 3, 3: 2 },
      },
    ],
  },
  {
    id: "q15",
    section: "rights-society",
    sectionLabel: "Rights and society",
    title: "Campaign finance and political speech",
    scenario:
      "A state limits independent political expenditures by corporations during state elections, arguing that unlimited corporate spending distorts the democratic process. A business coalition challenges the law as a violation of First Amendment free speech rights.",
    answers: [
      {
        id: "q15a",
        label: "Strike the limit — political spending is protected speech",
        description:
          "The First Amendment protects political speech, including spending to broadcast political messages. Government may not suppress political expression simply because the speaker is a corporation.",
        weights: { 2: 2, 4: 2, 1: 1 },
      },
      {
        id: "q15b",
        label: "Uphold the limit — democratic integrity justifies it",
        description:
          "Preventing disproportionate corporate influence over elections is a sufficiently compelling interest. The First Amendment was never meant to allow the wealthiest speakers to drown out all others.",
        weights: { 1: 2, 3: 2 },
      },
      {
        id: "q15c",
        label: "Distinguish individual from corporate spending and decide narrowly",
        description:
          "Protect individual political spending absolutely while allowing states more room to regulate corporate and PAC expenditures, resolving only what this case requires.",
        weights: { 5: 3, 3: 1 },
      },
    ],
  },
];

export default quizQuestions;
