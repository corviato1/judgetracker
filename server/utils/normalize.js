function normalizePerson(person) {
  const position = (person.positions || [])[0] || {};
  return {
    id: String(person.id),
    fullName: [person.name_first, person.name_middle, person.name_last]
      .filter(Boolean)
      .join(" "),
    courtName: position.court_short || position.court || "",
    jurisdiction: position.position_type_display || position.position_type || "",
    appointer: position.appointing_president || "",
    partyOfAppointment: position.political_affiliation_display || position.political_affiliation || "",
    serviceStartYear: position.date_start
      ? new Date(position.date_start).getFullYear()
      : null,
    gender: person.gender_display || person.gender || "",
    state: position.court_short || "",
    sampleCaseCount: null,
    source: "courtlistener",
  };
}

module.exports = { normalizePerson };
