const Teams = require('../../models/teams/teams');

exports.findUserTeam = async (id) => {
    const admin = await Teams.find({
        admin: id,
    });

    if (admin.length > 0) {
        const data = {
            id: admin[0].id,
            role: 'admin'
        }
        return data;
    }


    const member = await Teams.find(
        { members: id }
    );
    if (member.length > 0) {
        const data = {
            id: member[0].id,
            role: 'member'
        }
        return data;
    }

    const adminMember = await Teams.find(
        { adminMembers: id }
    );

    if (adminMember.length > 0) {
        const data = {
            id: adminMember[0].id,
            role: 'sub-admin'
        }
        return data;
    }
}