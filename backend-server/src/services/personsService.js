import { runQuery, runInsertQuery } from '../utils/db.js';
import logger from '../logger.js'; 

// Function to get all persons
const getAllPersons = async () => {
  logger.debug(`get all persons`);
  const query = `SELECT * FROM Persons`;
  return await runQuery(query, []);
};

// Function to get middle names for a person
const getAllMiddleNames = async () => {
  logger.debug(`get all middle names`);
  const query = `SELECT * FROM MiddleNames`;
  return await runQuery(query, []);
};

// Function to get middle names for a person
const addMiddleName = async (personId, middleName) => {
  const query = `
    INSERT INTO MiddleNames (person_id, middle_name) 
    VALUES (?, ?)
  `;
  await runInsertQuery(query, [personId, middleName]);
};

// Function to get middle names for a person
const getPersonById = async (personId) => {
  logger.debug(`Get person with ID: ${personId}`);
  const query = `SELECT * FROM Persons WHERE id = ?`;
  const person = await runQuery(query, [personId]);
  if (person.length === 0) {
    throw new Error('Person not found');
  }

  // Query to get the middle names for the person
  const middleNamesQuery = `SELECT * FROM MiddleNames WHERE person_id = ?`;
  const middleNames = await runQuery(middleNamesQuery, [personId]);

  return {
    ...person[0], 
    middle_names: middleNames
  };
};

// Function to add a new person
const addPerson = async (person) => {
  logger.debug(`Adding a person: ${person.first_name} ${person.last_name}`);
  const query = `
    INSERT INTO Persons (first_name, last_name, notes, gender, picture)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    person.first_name,
    person.last_name,
    person.notes || '',
    person.gender || 'Undefined',
    person.picture || null
  ];
  
  // insert person
  const insertId = await runInsertQuery(query, values);

  // fetch the newly inserted person's details to return
  const newPersonQuery = `SELECT * FROM Persons WHERE id = ?`;
  const newPerson = await runQuery(newPersonQuery, [insertId]);

  return newPerson[0];
};

// Function to edit an existing person
const editPerson = async (personId, person) => {
  logger.debug(`Editing person with ID: ${personId}`);
  const query = `
    UPDATE Persons
    SET first_name = ?, last_name = ?, notes = ?, gender = ?, picture = ?
    WHERE id = ?
  `;
  const values = [
    person.first_name,
    person.last_name,
    person.notes || '',
    person.gender || '',
    person.picture || '',
    personId
  ];
  
  await runQuery(query, values);

  // fetch the newly inserted person's details to return
  const newPersonQuery = `SELECT * FROM Persons WHERE id = ?`;
  const newPerson = await runQuery(newPersonQuery, [personId]);

  return newPerson[0];
};

// Function to delete a person by ID
const delPersonById = async (personId) => {
  const query = 'DELETE FROM Persons WHERE id = ?';
  await runQuery(query, [personId]);
};

// Function to delete middle names associated with a person
const deleteMiddleNamesByPersonId = async (personId) => {
  const query = 'DELETE FROM MiddleNames WHERE person_id = ?';
  await runQuery(query, [personId]);
};

// Function to delete relatives associated with a person
const delRelatives = async (personId) => {
  const query = 'DELETE FROM Relatives WHERE person_id = ?';
  await runQuery(query, [personId]);
};

// Function to get all persons
const getEnrichedPersons = async () => {
  logger.debug(`get all persons`);
  const personsQuery = `
    SELECT p.id, p.first_name, p.last_name, p.notes, p.gender, p.picture,
      (SELECT e.event_date 
       FROM Events e 
       JOIN Associations c ON e.id = c.event_id 
       WHERE c.person_id = p.id AND e.event_type = 'birth') AS birth_date,
      (SELECT e.event_verified 
       FROM Events e 
       JOIN Associations c ON e.id = c.event_id 
       WHERE c.person_id = p.id AND e.event_type = 'birth') AS birth_date_verified,
      (SELECT e.event_date 
       FROM Events e 
       JOIN Associations c ON e.id = c.event_id 
       WHERE c.person_id = p.id AND e.event_type = 'death') AS death_date,
      (SELECT e.event_verified 
       FROM Events e 
       JOIN Associations c ON e.id = c.event_id 
       WHERE c.person_id = p.id AND e.event_type = 'death') AS death_date_verified
    FROM Persons p 
    ORDER BY p.id ASC;
  `;
  
  // Retrieve all persons from the database
  const persons = await runQuery(personsQuery);

  // Enrich each person with additional information (events, relations, etc.)
  const enrichedPersons = await Promise.all(persons.map(async (person) => {
    const enrichedPerson = await getEnrichedPerson(person.id);
    return enrichedPerson;
  }));

  return enrichedPersons;
};

// Function to get person
const getEnrichedPerson = async (personId) => {
  logger.debug(`get details for person ${personId}`);
  const personQuery = `
          SELECT p.id, p.first_name, p.last_name, p.notes, p.gender, p.picture,
            (SELECT e.event_date 
              FROM Events e 
              JOIN Associations c ON e.id = c.event_id 
              WHERE c.person_id = p.id AND e.event_type = 'birth') AS birth_date,
            (SELECT e.event_verified 
              FROM Events e 
              JOIN Associations c ON e.id = c.event_id 
              WHERE c.person_id = p.id AND e.event_type = 'birth') AS birth_date_verified,
            (SELECT e.event_date 
              FROM Events e 
              JOIN Associations c ON e.id = c.event_id 
              WHERE c.person_id = p.id AND e.event_type = 'death') AS death_date,
            (SELECT e.event_verified 
              FROM Events e 
              JOIN Associations c ON e.id = c.event_id 
              WHERE c.person_id = p.id AND e.event_type = 'death') AS death_date_verified
          FROM Persons p 
          WHERE p.id = ?`;
  const [person] = await runQuery(personQuery, [personId]);
  if (!person) {
    logger.warn(`Person with ID ${personId} not found`);
    return null; // Return null if person is not found
  }

  const middleNames = await getMiddleNames(personId);
  const events = await getEvents(personId);
  const relatives = await getRelatives(personId);
  const children = await getChildren(personId);

  // Enrich events with related persons and attachments
  for (let event of events) {
    const eventRelations = await getEventRelations(personId, event.id,  event.event_type);
    event.related_persons = eventRelations.map(rel => ({
      id: rel.id,
      relation_type: rel.relation_type
    }));

    const eventAttachments = await getEventAttachments(event.id);
    event.related_attachments = eventAttachments.map(rel => ({
      id: rel.id,
      filepath: rel.file_path,
      file_path: rel.file_path,
      description: rel.description
    }));
  }

  // Convert event_verified from integer to boolean
  person.birth_date_verified = !!person.birth_date_verified;
  person.death_date_verified = !!person.death_date_verified;

  // Add children as events
  for (let child of children) {
    const birthEvent = {
      id: child.id,
      event_type: child.relation_type,
      event_date: child.event_date,
      event_verified: child.event_verified,
      event_place: child.event_place,
      event_notes: child.event_notes,
      related_persons: [{
        id: child.person_id,
        relation_type: 'child'
      }],
    };
    events.push(birthEvent);
  }
  
  // Sort events by event_date
  events.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  // Return the enriched details for the person
  const enrichedPerson = {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    birth_date: person.birth_date,
    death_date: person.death_date,
    birth_date_verified: person.birth_date_verified,
    death_date_verified: person.death_date_verified,
    notes: person.notes,
    gender: person.gender,
    picture: person.picture,
    middle_names: middleNames,
    events: events,
    relatives: relatives
  };
  return enrichedPerson
};

// Function to get middle names for a person
const getMiddleNames = async (personId) => {
  logger.debug(`get middle names for person ${personId}`);
  const query = `SELECT middle_name FROM MiddleNames WHERE person_id = ?`;
  return await runQuery(query, [personId]);
};

// Function to get events for a person
const getEvents = async (personId) => {
  logger.debug(`get events for person ${personId}`);
  const query = `
    SELECT e.id, e.event_type, e.event_date, e.event_verified, e.event_place, e.event_notes 
    FROM Events e 
    JOIN Associations c ON e.id = c.event_id 
    WHERE c.person_id = ? 
    ORDER BY e.event_date ASC;
  `;

  // Fetch data from the database
  const events = await runQuery(query, [personId]);

  // Convert event_verified to boolean
  return events.map(evt => ({
    ...evt,
    event_verified: evt.event_verified === 1 // Convert integer to boolean
  }));
};

// Function to get relations for a person
const getRelatives = async (personId) => {
  logger.debug(`get relatives for person ${personId}`);
  const query = `
    SELECT p.id, r.relation_type 
    FROM Persons p
    JOIN Relatives r ON p.id = r.related_person_id
    WHERE r.person_id = ?;
  `;
  return await runQuery(query, [personId]);
};

// Function to get children of a person
const getChildren = async (personId) => {
  logger.debug(`get children for person ${personId}`);
  const query = `
    SELECT p.id as person_id, p.first_name, p.last_name, r.relation_type, e.event_date, e.event_verified, e.id, e.event_place, e.event_notes
    FROM Persons p 
    JOIN Associations c ON p.id = c.person_id
    JOIN Events e ON e.event_type = 'birth' AND e.id = c.event_id
    JOIN Relatives r ON p.id = r.related_person_id 
    WHERE r.person_id = ? AND r.relation_type IN ('child');
  `;
  
  // Fetch data from the database
  const children = await runQuery(query, [personId]);

  // Convert event_verified to boolean
  return children.map(child => ({
    ...child,
    event_verified: child.event_verified === 1 // Convert integer to boolean
  }));
};

// Function to get event relations
const getEventRelations = async (personId, eventId, eventType) => {
  logger.debug(`get event relations for person ${personId} and event ${eventId}`);
  let relationsQuery;
  const normalizedType = (eventType || '').toLowerCase().replace(/[\s_-]+/g, '_');
  switch (normalizedType) {
    case 'birth':
      relationsQuery = `
        SELECT r.relation_type, p.id, p.first_name, p.last_name 
        FROM Relatives r 
        JOIN Persons p ON r.related_person_id = p.id 
        WHERE r.person_id = ? AND r.relation_type IN ('father', 'mother');
      `;
      return await runQuery(relationsQuery, [personId]);

    case 'divorce':
    case 'marriage':
    case 'mariage':
    case 'civil_union':
    case 'civil_separation':
    case 'union_civile':
    case 'separation_civile':
      relationsQuery = `
        SELECT DISTINCT 
          COALESCE(r.relation_type, 'spouse') AS relation_type,
          p.id, p.first_name, p.last_name
        FROM Persons p
        JOIN Associations c ON p.id = c.person_id
        LEFT JOIN Relatives r ON (r.person_id = ? AND r.related_person_id = p.id)
        WHERE c.event_id = ? AND c.person_id != ?;
      `;
      return await runQuery(relationsQuery, [personId, eventId, personId]);

    default:
      return [];
  }
};

// Function to get event attachments
const getEventAttachments = async (eventId) => {
  logger.debug(`get event attachment for ${eventId}`);
  const attachmentsQuery = `SELECT id, file_path, description FROM Attachments WHERE event_id = ?;`;
  return await runQuery(attachmentsQuery, [eventId]);
};

export { 
  getAllPersons, getAllMiddleNames, getEnrichedPersons, getEnrichedPerson, getMiddleNames, 
  getEvents, getRelatives, getChildren, getEventRelations, getEventAttachments, getPersonById,
  addPerson, addMiddleName,
  editPerson,
  delPersonById, deleteMiddleNamesByPersonId, delRelatives
};

