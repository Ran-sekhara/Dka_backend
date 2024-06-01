const Doctor = require('../models/doctor');
const bcrypt = require('bcrypt');
const DoctorServices = require('../services/doctor.service');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const nodemailer = require('nodemailer');
const Patient = require('../models/patient');
const MedicalFolder = require('../models/medicalfolder');
const Test = require('../models/test');
const DKAHistory = require('../models/dkahistory');


// Create a doctor
exports.createDoctor = async (req, res) => {
  try {
      const { first_name, last_name, email, phone, role, address, speciality, image_url , pdf_url,verificationNumber,isVerified} = req.body;

      // Check if doctor with the same email already exists
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
          return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
      }

      // Create new doctor
      const doctor = await Doctor.create({
        first_name,
        last_name,
        email,
        phone,
        role,
        address,
        speciality,
        image: image_url,
        pdf_path : pdf_url,
        is_approved: false,
        passwordChanged: false,
        verificationNumber,
        isVerified: false,
        
    });

    res.json({ status: true, message: 'Doctor registration request sent successfully', id: doctor.id_doctor });
} catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
}
};

// Log in the doctor
exports.loginDoctor = async (req, res, next) => {
  try {
      const { email, password } = req.body;

      // Retrieve doctor by email
      const doctor = await Doctor.findOne({ where: { email } });
      if (!doctor) {
          return res.status(404).json({ status: false, message: 'Doctor does not exist' });
      }

      // Compare passwords
      const isPasswordCorrect = await bcrypt.compare(password, doctor.password);
      if (!isPasswordCorrect) {
          return res.status(401).json({ status: false, message: 'Incorrect password' });
      }

      const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
      const expiresIn = 365 * oneDayInSeconds;

      const tokenData = {
          id: doctor.id_doctor,
          email: doctor.email,
          role: "doctor",
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          image: doctor.image 
        
        };

      const token = await DoctorServices.generateAccessToken(tokenData, expiresIn);
      const passwordChanged = doctor.passwordChanged;

      res.status(200).json({ status: true, message: 'Successfully logged in', token, passwordChanged ,image: doctor.image});
  } catch (error) {
      console.error('Error logging in doctor:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//recoverPassword
exports.recoverPassword = async (req, res) => {
  try {
    const { email } = req.body; // Extract doctorId from params

   
    // Find the doctor with the given ID
    const doctor = await Doctor.findOne({ where: { email } });

    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor does not exist' });
    }

// Generate a new 7-digit random number
const newNumber = Math.floor(1000000 + Math.random() * 9000000); // Random number between 1000000 and 9999999


doctor.verificationNumber = newNumber;
    await doctor.save();
    // Send an email to the user with the new password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'arrr04445@gmail.com', // replace with your Gmail email address
        pass: 'ubam ykau zobp hxcu', // replace with your Gmail password
      },
    });

    const mailOptions = {
      from: 'arrr04445@gmail.com',
      to: doctor.email, // Use doctor's email for password recovery
      subject: 'Password Recovery',
      text: `Your codeis: ${newNumber}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ status: true, message: 'Password recovery successful' });
    });
  } catch (error) {
    console.error('Error during password recovery:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
// verifyVerificationNumber
exports.verifyVerificationNumber = async (req, res) => {
  try {
    const { email, enteredNumber } = req.body; // Extract doctorId and enteredNumber from params

    // Find the doctor with the given email
    const doctor = await Doctor.findOne({ where: { email } });

    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor does not exist' });
    }

    // Compare the enteredNumber with the saved verificationNumber
    if (enteredNumber === doctor.verificationNumber.toString()) {
      // If the numbers match, set isVerified to true
      doctor.isVerified = true;
      await doctor.save();
      return res.status(200).json({ status: true, message: 'Number verified successfully' });
    } else {
      return res.status(400).json({ status: false, message: 'Incorrect number entered' });
    }
  } catch (error) {
    console.error('Error during number verification:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// Check email existence route handler
exports.checkEmailExistence = async (req, res) => {
  try {
    const { email } = req.body;

    const existingDoctor = await Doctor.findOne({ where: { email } });

    if (existingDoctor) {
      res.status(200).json({ exists: true, message: 'Email exists in the database' });
    } else {
      res.status(404).json({ exists: false, message: 'Email does not exist in the database' });
    }
  } catch (error) {
    console.error('Error checking email existence:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

  //see all doctors
  exports.getAllDoctors = async (req, res) => {
    try {
      const doctors = await Doctor.findAll({
        attributes: ['id_doctor', 'first_name', 'last_name', 'email', 'speciality','image'],
      });
  
      res.status(200).json({ status: true, doctors });
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  };

//get patients list associated to the doctor
exports.getDoctorPatientsInfo = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Ensure that doctorId is a valid integer
    if (isNaN(parseInt(doctorId))) {
      return res.status(400).json({ error: 'Invalid doctorId' });
    }

    // Retrieve all patients associated with the doctor
    const patients = await Patient.findAll({ where: { id_doctor: doctorId } });

    if (!patients || patients.length === 0) {
      return res.status(404).json({ status: false, message: 'No patients found for this doctor' });
    }

    // Array to store patient information
    const patientsInfo = [];

    // Iterate over each patient to retrieve their details
    for (const patient of patients) {
      // Retrieve medical folder information for the patient
      const medicalFolder = await MedicalFolder.findOne({
        where: { id_patient: patient.id_patient },
        attributes: [
          'id_patient',
          'id_folder', // Include id_folder attribute
          'diabetes_type',
          'diabetes_history',
          'datebirth',
          'gender',
          'height',
          'weight'
        ]
      });

      // Find the latest DKA test for the patient
      const latestDkaHistory = await DKAHistory.findOne({
        where: { id_folder: medicalFolder.id_folder },
        order: [['date', 'DESC']], // Get the latest DKA history based on date
        attributes: ['date', 'acetoneqet', 'order']
      });

      // Combine personal, medical, and DKA history information
      const patientInfo = {
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        medical_folder: medicalFolder,
        dka_history: latestDkaHistory // Include the latest DKA history
      };

      patientsInfo.push(patientInfo);
    }

    res.json({ status: true, message: 'Doctor patients information found', patients: patientsInfo });
  } catch (error) {
    console.error('Error getting doctor patients information:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//find the doctor
exports.getAllDoctorsByName = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: ['id_doctor', 'first_name', 'last_name'],
    });

    res.status(200).json({ status: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//see doctor profile
exports.doctorprofile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findOne({ where: { id_doctor: doctorId } });
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor does not exist' });
    }

    // Return the doctor details
    res.json({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      email: doctor.email,
      password: doctor.password, 
      phone: doctor.phone,
      address: doctor.address,
      speciality: doctor.speciality,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//update profile
exports.updateProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    let doctor = await Doctor.findOne({ where: { id_doctor: doctorId } });
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor does not exist' });
    }

    doctor.first_name = req.body.first_name || doctor.first_name;
    doctor.last_name = req.body.last_name || doctor.last_name;
    doctor.email = req.body.email || doctor.email;
    doctor.phone = req.body.phone || doctor.phone;
    doctor.address = req.body.address || doctor.address;
    doctor.speciality = req.body.speciality || doctor.speciality;


       // Check if password is provided in the request body
       if (req.body.password) {
        // Hash the password before updating
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // Use bcrypt for hashing
        doctor.password = hashedPassword;
      }
    doctor = await doctor.save();


    res.json({ 
      status: true,
      message: 'Doctor profile updated successfully',
      data: {
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        password: doctor.password,
        phone: doctor.phone,
        address: doctor.address,
        speciality: doctor.speciality
      }
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//counting the number of patient for the doctor
exports.getDoctorPatientsCount = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const patientCount = await Patient.count({ where: { id_doctor: doctorId } });

    // Send response with patient count
    res.status(200).json({ count: patientCount });
  } catch (error) {
    console.error('Error fetching patient count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//update the password
exports.updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (newPassword.length < 7) {
      return res.status(400).json({ status: false, message: 'Password must be at least 7 characters long' });
    }

    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Email not found. Please enter a registered email address.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Assuming 10 is the salt rounds

    await Doctor.update(
      { password: hashedPassword, passwordChanged: true }, // Values to update
      { where: { email } } // Condition to match records for updating
    );

    // Retrieve the updated doctor to ensure the updated value of passwordChanged
    const updatedDoctor = await Doctor.findOne({ where: { email } });

    return res.status(200).json({ status: true, message: 'Password reset successful', passwordChanged: updatedDoctor.passwordChanged });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

//update the password with confirmation
exports.updatePasswordWithConfirmation = async (req, res) => {
  try {
    const { doctorId, currentPassword, newPassword } = req.body;

    const doctor = await Doctor.findOne({ where: { id_doctor: doctorId } });
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor not found' });
    }

    // Compare current password with the password stored in the database
    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, doctor.password);
    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({ status: false, message: 'Incorrect current password' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await Doctor.update(
      { password: hashedNewPassword, passwordChanged: true },
      { where: { id_doctor: doctorId } }
    );

    // Retrieve the updated doctor to ensure the updated value of passwordChanged
    const updatedDoctor = await Doctor.findOne({ where: { id_doctor: doctorId } });

    return res.status(200).json({ status: true, message: 'Password updated successfully', passwordChanged: updatedDoctor.passwordChanged });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
exports.createOptionalDoctor = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const role = 'doctor'; 

    const doctor = await Doctor.create({
      first_name,
      last_name,
      role, 
      optional: true 
    });

    res.status(200).json({ status: true, message: 'Doctor created successfully', id: doctor.id_doctor});
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};
exports.getArchivedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      where: { archived: true },
      attributes: ['id_doctor', 'first_name', 'last_name', 'email', 'phone', 'speciality','is_approved', 'address', 'image'],
    });

    res.status(200).json({ status: true, doctors });
  } catch (error) {
    console.error('Error fetching archived doctors:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

exports.archivedDoctor = async (req, res) => {
  const { doctorId } = req.params;
  console.log('Received request to archive patient with ID:', doctorId); // Print received patient ID

  try {
    const doctor = await Doctor.findByPk(doctorId);
    console.log('Patient found:', doctor); // Print patient object

    if (!doctor) {
      console.log('Patient not found'); // Print error message
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update the archived field to true
    doctor.archived = true;
    await doctor.save();

    console.log('Patient profile archived successfully'); // Print success message
    res.status(200).json({ message: 'Patient profile archived successfully' });
  } catch (error) {
    console.error('Error archiving patient profile:', error); // Print error message
    res.status(500).json({ error: 'Failed to archive patient profile' });
  }
};

exports.unarchiveDoctor = async (req, res) => {
  const { doctorId } = req.params;
  console.log('Received request to unarchive doctor with ID:', doctorId); // Print received doctor ID

  try {
    const doctor = await Doctor.findByPk(doctorId);
    console.log('Doctor found:', doctor); // Print doctor object

    if (!doctor) {
      console.log('Doctor not found'); // Print error message
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Update the archived field to false
    doctor.archived = false;
    await doctor.save();

    console.log('Doctor profile unarchived successfully'); // Print success message
    res.status(200).json({ message: 'Doctor profile unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving doctor profile:', error); // Print error message
    res.status(500).json({ error: 'Failed to unarchive doctor profile' });
  }
};
