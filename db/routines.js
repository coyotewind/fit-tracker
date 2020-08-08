const client = require('./client.js');

async function createRoutine( { creatorId, name, goal, activities = [] } ) {
    try {
        const { rows: [ routine ] } = await client.query(`
            INSERT INTO routines("creatorId", name, goal) 
            VALUES($1, $2, $3)
            RETURNING *;
        `, [creatorId, name, goal]);
        return routine;
        
    } catch (error) {
        throw error;
    }
}

async function updateRoutine(routineId, fields = {}) {
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');
    
    if (setString.length === 0) {
        return;
    }
    try {
        const { rows: [routine] } = await client.query(`
            UPDATE routines
            SET ${ setString}
            WHERE "creatorId"=${ routineId }
            RETURNING *;
        `, Object.values(fields));
        return routine;
    } catch (error) {
        throw error;
    }
}

async function getAllRoutines() {
    try {
        const { rows: routineIds } = await client.query(`
            SELECT id
            FROM routines;
        `);
        const routines = await Promise.all(routineIds.map(
            routine => getRoutineById( routine.id )
        ));
        return routines;
    } catch (error) {
      throw error;
    }
}

async function getPublicRoutines() {
    try {
        const { rows: publicRoutines } = await client.query(`
            SELECT *
            FROM routines
            WHERE public=true;
        `);
        // const routines = await Promise.all(routineIds.map(
        //     routine => getRoutineById( routine.id )
        // ));
        return publicRoutines;
    } catch (error) {
      throw error;
    }
}

async function getRoutinesByUser({ username }) {
    try {
        const { rows: [userId] } = await client.query(`
            SELECT id
            FROM users
            WHERE username=$1
        `, [username]);
        const routineId = userId.id
        const { rows: [routines] } = await client.query(`
            SELECT *
            FROM routines
            WHERE "creatorId"=$1
        `,[routineId]);
        return routines;
    } catch (error) {
      throw error;
    }
}

async function getPublicRoutinesByUser({ username }) {
    try {
        const { rows: [userId] } = await client.query(`
            SELECT id
            FROM users
            WHERE username=$1;
        `, [username]);
        const routineId = userId.id
        const { rows: [routines] } = await client.query(`
            SELECT *
            FROM routines
            WHERE "creatorId"=$1 AND public=true;
        `,[routineId]);
        return routines;
    } catch (error) {
      throw error;
    }
}

// async function getPublicRoutinesByActivity({ name }) {
//     try {
//         const { rows: [routineId] } = await client.query(`
//             SELECT id
//             FROM routine
//             WHERE name=$1;
//         `, [name]);

//         const activityId = routineId.id

//         const { rows: [activities] } = await client.query(`
//             SELECT *
//             FROM activities
//             WHERE "creatorId"=$1 AND public=true;
//         `,[activityId]);
//         return activities;
//     } catch (error) {
//       throw error;
//     }
// }

async function getPublicRoutinesByActivity(activityName) {
    try {
        const { rows: routineIds } = await client.query(`
            SELECT routines.id
            FROM routines
            JOIN routine_activities ON routines.id=routine_activities."routineId"
            JOIN activities ON activities.id=routine_activities."activityId"
            WHERE activities.name=$1 AND public=true;
        `, [activityName]);
  
        return await Promise.all(routineIds.map(
            routine => getRoutineById(routine.id)
        ));
    } catch (error) {
        throw error;
    }
} 

async function getRoutineById(routineId) {
    try {
        const { rows: [ routine ]  } = await client.query(`
            SELECT *
            FROM routines
            WHERE id=$1;
        `, [routineId]);
        if (!routine) {
            throw {
              name: "RoutineNotFoundError",
              message: "Could not find a routine with that routineId"
            };
          }
        const { rows: activities } = await client.query(`
            SELECT activities.*
            FROM activities
            JOIN routine_activities ON activities.id=routine_activities."activityId"
            WHERE routine_activities."routineId"=$1;
        `, [routineId])
        const { rows: [creator] } = await client.query(`
            SELECT id, username
            FROM users
            WHERE id=$1;
        `, [routine.creatorId])
        routine.activities = activities;
        routine.creator = creator;
        delete routine.creatorId;
        return routine;
    } catch (error) {
      throw error;
    }
}

module.exports = {
    createRoutine,
    updateRoutine,
    getAllRoutines,
    getPublicRoutines,
    getRoutinesByUser,
    getPublicRoutinesByUser,
    getPublicRoutinesByActivity,
    getRoutineById
}