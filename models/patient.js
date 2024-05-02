const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Device = require('./device');
const MedicalFolder = require('./medicalfolder');
const Test = require('./test');


const Patient = sequelize.define('patient', {
    id_patient: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    gender: {
        type: DataTypes.ENUM('Female', 'Male'),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    archived:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    id_doctor: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
 
}, {
    timestamps: false // Disable timestamps
});

Patient.hasOne(MedicalFolder, { foreignKey: 'id_patient'});
Patient.hasMany(Test,{foreignKey :'id_patient'});
Patient.hasMany(Device, { foreignKey: 'id_patient' });

module.exports = Patient;