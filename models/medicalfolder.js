const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DkaHistory = require('./dkahistory');
const moment = require('moment');

const MedicalFolder = sequelize.define('medicalfolder', {
    id_folder: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    diabetes_type: {
        type: DataTypes.ENUM('Type 1', 'Type 2'),
        allowNull: true
    },
    diabetes_history: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    is_smoke: {
        type: DataTypes.ENUM('Yes','No'),
        allowNull: true,
    },
    area: {
        type: DataTypes.ENUM('Northeast','Northwest','Southeast','Southwest','Center'),
        allowNull: true,
    },
    archived:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    id_patient: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: false,
    getterMethods: {
        bmi() {
            if (this.height && this.weight) {
                const heightInMeters = parseFloat(this.height) / 100;
                const weightInKg = parseFloat(this.weight);
                return (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
            }
            return null;
        }
    }
});

MedicalFolder.hasMany(DkaHistory, { foreignKey: 'id_folder' });
DkaHistory.belongsTo(MedicalFolder, { foreignKey: 'id_folder' });

module.exports = MedicalFolder;
