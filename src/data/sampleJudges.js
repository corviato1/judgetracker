const sampleJudges = [
  {
    id: 1,
    fullName: "The Civil Libertarian",
    courtName: "U.S. Court of Appeals, 9th Circuit",
    jurisdiction: "Federal appellate court",
    appointer: "Appointed by Democratic administration",
    partyOfAppointment: "Democratic",
    serviceStartYear: 2009,
    sampleCaseCount: 620,
    description:
      "Prioritizes individual rights and broad constitutional protections. Tends to rule against government overreach and in favor of civil liberties, free speech, and equal protection claims. Often reads constitutional guarantees expansively to protect minorities and the vulnerable from majoritarian pressure.",
    realJudge: {
      name: "Sonia Sotomayor",
      court: "U.S. Supreme Court",
      appointer: "Appointed by President Obama, 2009",
      note: "Justice Sotomayor is the Court's most consistent champion of civil liberties, frequently authoring dissents defending Fourth Amendment rights, voting rights, and the rights of the criminally accused.",
    },
  },
  {
    id: 2,
    fullName: "The Textualist",
    courtName: "U.S. Court of Appeals, 5th Circuit",
    jurisdiction: "Federal appellate court",
    appointer: "Appointed by Republican administration",
    partyOfAppointment: "Republican",
    serviceStartYear: 2005,
    sampleCaseCount: 810,
    description:
      "Interprets statutes and the Constitution based on their plain text and ordinary meaning at the time of enactment. Defers to the legislature on policy questions and resists judicial expansion of rights beyond what the text clearly supports. Skeptical of legislative history as a source of statutory meaning.",
    realJudge: {
      name: "Neil Gorsuch",
      court: "U.S. Supreme Court",
      appointer: "Appointed by President Trump, 2017",
      note: "Justice Gorsuch is one of the Court's strongest textualists, applying plain-meaning analysis across both conservative and liberal outcomes — most notably in Bostock v. Clayton County, where he held that 'sex' in Title VII covers sexual orientation and gender identity.",
    },
  },
  {
    id: 3,
    fullName: "The Pragmatist",
    courtName: "State Supreme Court (Midwest)",
    jurisdiction: "State supreme court",
    appointer: "Non-partisan retention election",
    partyOfAppointment: "Non-partisan",
    serviceStartYear: 2001,
    sampleCaseCount: 390,
    description:
      "Applies a case-by-case balancing test, weighing practical outcomes and real-world fairness over rigid doctrinal categories. Focuses on whether a result makes sense in context. Willing to borrow from different interpretive methods when the situation calls for it, rather than committing to a single theory.",
    realJudge: {
      name: "Stephen Breyer",
      court: "U.S. Supreme Court (Ret.)",
      appointer: "Appointed by President Clinton, 1994",
      note: "Justice Breyer championed an 'active liberty' approach throughout his tenure — weighing practical consequences and democratic values rather than rigid doctrinal rules, and asking what interpretation best serves the law's real-world purpose.",
    },
  },
  {
    id: 4,
    fullName: "The Originalist",
    courtName: "U.S. Court of Appeals, D.C. Circuit",
    jurisdiction: "Federal appellate court",
    appointer: "Appointed by Republican administration",
    partyOfAppointment: "Republican",
    serviceStartYear: 2003,
    sampleCaseCount: 740,
    description:
      "Interprets the Constitution according to its original public meaning at the time of ratification. Deeply skeptical of judge-made rights expansions not grounded in history or constitutional text. Believes that structural limits on government power — separation of powers, federalism — are as important as individual rights, and that democratic change should happen through legislatures, not courts.",
    realJudge: {
      name: "Clarence Thomas",
      court: "U.S. Supreme Court",
      appointer: "Appointed by President H.W. Bush, 1991",
      note: "Justice Thomas is the Court's most committed originalist, regularly writing separately to argue that precedents inconsistent with the Constitution's original public meaning should be reconsidered — including landmark rulings others treat as settled.",
    },
  },
  {
    id: 5,
    fullName: "The Institutionalist",
    courtName: "U.S. Supreme Court",
    jurisdiction: "Federal supreme court",
    appointer: "Appointed by bipartisan consensus",
    partyOfAppointment: "Non-partisan",
    serviceStartYear: 1998,
    sampleCaseCount: 560,
    description:
      "Prioritizes the long-term legitimacy and stability of the judicial institution above any particular legal theory. Prefers narrow, consensus-building rulings over sweeping decisions. Treats established precedent as a strong reason to rule cautiously, believing courts should not move faster than democratic consensus — and that losing public trust is itself a constitutional harm.",
    realJudge: {
      name: "John G. Roberts Jr.",
      court: "U.S. Supreme Court (Chief)",
      appointer: "Appointed by President G.W. Bush, 2005",
      note: "Chief Justice Roberts consistently seeks narrow rulings that command broad consensus, regularly casting the deciding vote to avoid sweeping decisions — prioritizing the Court's institutional standing over any single legal theory.",
    },
  },
];

export default sampleJudges;
