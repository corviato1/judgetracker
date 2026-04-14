const quizQuestions = [
  // ─── Section 1: Interpreting the law ────────────────────────────────────────
  {
    id: "q1",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "Statutory text versus legislative purpose",
    scenario:
      "A federal environmental law requires companies to report any 'release' of hazardous chemicals. The statute defines 'release' in one place but is silent on whether the word covers purely accidental spills. A company argues the plain text applies only to intentional acts; the EPA says Congressional intent was to cover all discharges.",
    answers: [
      {
        id: "q1a",
        label: "Follow the plain text",
        description:
          "The word 'release' in its ordinary meaning covers accidental spills too. Stick to what the statute says — if Congress wanted an intent requirement, it would have written one.",
        weights: { 2: 3, 4: 2 },
      },
      {
        id: "q1b",
        label: "Look at legislative history and purpose",
        description:
          "The statute was meant to protect public health broadly. Reading it to exclude accidents would defeat its purpose — courts should interpret laws to fulfill their evident goals.",
        weights: { 1: 2, 3: 2 },
      },
      {
        id: "q1c",
        label: "Defer to the agency's reasonable reading",
        description:
          "The EPA has expertise in this area, and its interpretation is at least plausible. In a close case, the agency charged with administering the law should get the benefit of the doubt.",
        weights: { 3: 2, 5: 2 },
      },
    ],
  },
  {
    id: "q2",
    section: "interpreting-law",
    sectionLabel: "Interpreting the law",
    title: "Unenumerated constitutional rights",
    scenario:
      "A state restricts access to a medical procedure that has been practiced privately for decades. The plaintiff argues that the Constitution's protection of 'liberty' extends to personal medical decisions, even though no specific text names this right.",
    answers: [
      {
        id: "q2a",
        label: "Recognize the right as fundamental",
        description:
          "Liberty means more than what was listed in 1791. The Constitution's broadly worded guarantees protect personal autonomy in decisions this intimate, even without explicit text.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q2b",
        label: "No right without historical grounding",
        description:
          "Courts cannot invent rights not rooted in the Constitution's text or deeply embedded in the nation's history. If the people want this protection, they should enact it through legislation.",
        weights: { 4: 3, 2: 2 },
      },
      {
        id: "q2c",
        label: "Decide narrowly on the specific facts",
        description:
          "Rather than issuing a broad ruling on unenumerated rights, resolve only whether this particular restriction is so arbitrary that it fails even basic rational review.",
        weights: { 5: 3, 3: 1 },
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
    title: "Overturning settled precedent",
    scenario:
      "A 35-year-old Supreme Court ruling on property rights is now widely criticized as wrongly decided. The original majority relied heavily on policy reasoning; subsequent decisions have not built heavily on it, and the original dissenters argued it had no textual basis.",
    answers: [
      {
        id: "q4a",
        label: "Overturn it — it was wrong and remains wrong",
        description:
          "Stare decisis does not require courts to follow decisions that were incorrectly reasoned from the start. Correcting error is more important than false consistency.",
        weights: { 4: 3, 2: 1 },
      },
      {
        id: "q4b",
        label: "Preserve it — stability outweighs re-examination",
        description:
          "Even imperfect precedent provides the predictability the legal system depends on. Courts should not overturn long-settled law simply because a current majority would decide differently.",
        weights: { 5: 3, 3: 1 },
      },
      {
        id: "q4c",
        label: "Narrow it sharply without formally overruling",
        description:
          "Limit the precedent to its specific facts so it can cause no further harm, while leaving the formal question of overruling to a case that squarely requires it.",
        weights: { 5: 2, 3: 2, 1: 1 },
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
        weights: { 2: 2, 4: 2 },
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
    title: "Bail and pretrial detention",
    scenario:
      "A low-income defendant charged with a drug offense cannot afford the $5,000 cash bail set by the court. The prosecution argues bail is needed to ensure appearance at trial. The defendant has strong community ties, steady employment, and no prior failures to appear.",
    answers: [
      {
        id: "q6a",
        label: "Reduce or eliminate the cash requirement",
        description:
          "Detaining someone only because they are poor — when a wealthier person with the same risk profile would go free — violates equal protection and due process.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q6b",
        label: "Uphold the bail as set",
        description:
          "The court applied the applicable legal standard. Bail determinations belong to trial courts who can assess flight risk firsthand, and reviewing courts should not second-guess them.",
        weights: { 2: 2, 4: 1, 5: 1 },
      },
      {
        id: "q6c",
        label: "Remand for an individualized bail hearing",
        description:
          "Require the trial court to hold a hearing that addresses this defendant's actual risk profile before ordering continued detention, rather than relying on a standard bail schedule.",
        weights: { 5: 2, 3: 2 },
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
    title: "Habeas corpus and new evidence",
    scenario:
      "A prisoner files a habeas petition arguing that new DNA evidence — technology that did not exist at the time of conviction — strongly suggests innocence. Federal procedural rules required such claims to be filed within one year of conviction, a deadline that passed years before the science was available.",
    answers: [
      {
        id: "q8a",
        label: "Allow the petition — no deadline bars an innocence claim",
        description:
          "Procedural rules are tools for efficiency, not traps for the actually innocent. A credible claim of innocence based on genuinely new science should always reach the merits.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q8b",
        label: "Apply the deadline — Congress set the rules",
        description:
          "Habeas review has congressionally defined limits that courts must enforce. Courts that ignore statutes they find inconvenient undermine the rule of law.",
        weights: { 2: 3, 4: 1 },
      },
      {
        id: "q8c",
        label: "Recognize a narrow equitable exception for unavailable science",
        description:
          "Equity tolls deadlines when compliance was objectively impossible. Create a narrow exception specifically for newly available forensic technology, decide only this case's facts.",
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
    title: "Standing — who can bring a lawsuit",
    scenario:
      "An environmental advocacy group sues a federal agency over a permit that will increase pollution in a river where some members fish and swim. No member has become ill, but the group argues that degraded water quality itself is an injury to their members' recreational and aesthetic interests.",
    answers: [
      {
        id: "q11a",
        label: "Recognize standing — recreational injury is enough",
        description:
          "Courts have long recognized that threatened harm to recreation and natural environments constitutes an injury for standing purposes. Requiring physical illness sets the bar far too high.",
        weights: { 1: 3, 3: 1 },
      },
      {
        id: "q11b",
        label: "Dismiss — injury must be concrete and to specific individuals",
        description:
          "Article III requires a real, particularized injury to a named plaintiff, not a generalized grievance felt by the public. Standing rules prevent courts from becoming roving policy-makers.",
        weights: { 4: 3, 2: 2 },
      },
      {
        id: "q11c",
        label: "Allow standing only for members who regularly use the river",
        description:
          "Find standing narrowly for those members who can document specific, regular contact with the affected waterway, but dismiss broader associational theories that rest on speculation.",
        weights: { 5: 3, 3: 1 },
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
