function normalizePerson(person) {
  const position = (person.positions || [])[0] || {};

  const fullName =
    [person.name_first, person.name_middle, person.name_last].filter(Boolean).join(" ") ||
    person.name ||
    "";

  const partyOfAppointment =
    position.political_affiliation_display ||
    (Array.isArray(position.political_affiliation)
      ? position.political_affiliation[0]
      : position.political_affiliation) ||
    (Array.isArray(person.political_affiliation)
      ? person.political_affiliation[0]
      : person.political_affiliation) ||
    "";

  const appointer = position.appointing_president || position.appointer || "";

  return {
    id: String(person.id),
    fullName,
    courtName: position.court_short || position.court || "",
    jurisdiction: position.position_type_display || position.position_type || "",
    appointer,
    partyOfAppointment,
    serviceStartYear: position.date_start
      ? new Date(position.date_start).getFullYear()
      : null,
    gender: person.gender_display || person.gender || "",
    state: position.court_short || position.court || "",
    sampleCaseCount: null,
    source: "courtlistener",
  };
}

module.exports = { normalizePerson };
