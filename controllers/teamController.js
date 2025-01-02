const i18n = require('i18n');

const { User } = require('../models/User');
const { Company } = require('../models/Company');
const { Team, TeamParticipant } = require('../models/Team');



const createTeam = async (req, res) => {

};

const changeTeamData = async (req, res) => {

};

const addToTeam = async (req, res) => {

};

const removeFromTeam = async (req, res) => {

};

const elevateToManager = async (req, res) => {

};

const lowerToParticipant = async (req, res) => {

};

const deleteTeam = async (req, res) => {

};

module.exports = {
  createTeam, changeTeamData, addToTeam, removeFromTeam,
  elevateToManager, lowerToParticipant, deleteTeam
};