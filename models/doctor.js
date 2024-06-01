const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./patient');
const Doctor = sequelize.define('doctor', {
    id_doctor: {
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
        allowNull: true,
        unique: true
    },
    phone: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    speciality: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    },
    pdf_path:{
        type: DataTypes.STRING,
        allowNull: true 
    },
    passwordChanged:{
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    },
    verificationNumber:{
        type: DataTypes.STRING,
        allowNull: true 
    },
    isVerified:{
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    },
    archived:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    optional: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
}, {
    timestamps: false // Disable timestamps
});
Doctor.hasMany(Patient, { foreignKey: 'id_doctor' });

module.exports = Doctor;