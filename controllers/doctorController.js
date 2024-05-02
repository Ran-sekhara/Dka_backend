const Doctor = require('../models/doctor');
const bcrypt = require('bcrypt');
const DoctorServices = require('../services/doctor.service');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const nodemailer = require('nodemailer');
const Patient = require('../models/patient');
const MedicalFolder = require('../models/medicalfolder');


// Create a doctor
exports.createDoctor = async (req, res) => {
  try {
      const { first_name, last_name, email, phone, role, address, speciality} = req.body;

     // if (password.length < 7) {
    //    return res.status(400).json({ status: false, message: 'Password must be at least 7 characters long' });
   // }

      // Check if doctor with the same email already exists
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
          return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
      }

      // // Hash the password
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(password, salt);

      // Create new doctor
      const doctor = await Doctor.create({
        first_name,
        last_name,
        email,
        phone,
        role,
        address,
        speciality,
        is_approved: false
       
    });

    res.json({ status: true, message: 'Doctor registration request sent successfully', id: doctor.id_doctor });
} catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
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
          };
                    const token = await DoctorServices.generateAccessToken(tokenData, expiresIn)

        res.status(200).json({ status: true, message: 'Successfully logged in',token: token });
    } catch (error) {
        console.error('Error logging in doctor:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


  exports.recoverPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Generate a new password
      const newPassword = generateNewPassword();
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the user's password in the database
      const updatedDoctor = await Doctor.update(
        { password: hashedPassword },
        { where: { email } }
      );
  
      // Send an email to the user with the new password
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'poussypoussita@gmail.com', // replace with your Gmail email address
          pass: 'jfur hdex mcue ebyc', // replace with your Gmail password
        },
      });
  
      const mailOptions = {
        from: 'poussypoussita@gmail.com',
        to: email,
        subject: 'Password Recovery',
        text: `Your new password is: ${newPassword}`,
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


  exports.getAllDoctors = async (req, res) => {
    try {
        // Retrieve all doctors where archived is false
        const doctors = await Doctor.findAll({
            attributes: ['id_doctor', 'first_name', 'last_name', 'email', 'phone', 'speciality', 'address', 'is_approved','optional','image'],
            where: {
                archived: false,
                optional: false
            }
        });

        const totalDoctors = doctors.length;

        res.status(200).json({ status: true, totalDoctors, doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

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


  exports.getDoctorPatientsInfo = async (req, res) => {
    try {
        const { doctorId } = req.params;

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
            const medicalFolder = await MedicalFolder.findOne({ where: { id_patient: patient.id_patient },
                attributes: [
                    'diabetes_type',
                    'diabetes_history',
                    'dka_history',
                    'age',
                    'gender',
                    'height',
                    'weight'
                ]});

            // Combine personal and medical information
            const patientInfo = {
                first_name: patient.first_name,
                last_name: patient.last_name,
                email: patient.email,
                phone: patient.phone,
                address: patient.address,
                medical_folder: medicalFolder 
            };

            patientsInfo.push(patientInfo);
        }

        res.json({ status: true, message: 'Doctor patients information found', patients: patientsInfo });
    } catch (error) {
        console.error('Error getting doctor patients information:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};







exports.uploadImage = async (req, res) => {
  try {
      const { id } = req.params;
      console.log('Doctor ID:', id); // Print doctor ID to verify it's being received correctly

      const doctor = await Doctor.findByPk(id);
      if (!doctor) {
          console.log('Doctor not found');
          return res.status(404).json({ error: 'Doctor not found' });
      }

      const image = req.file.buffer; // Get image data from uploaded file
      console.log('Image data:', image); // Print image data to verify it's being received correctly

      // Update the doctor's image in the database
      await doctor.update({ image });

      console.log('Image uploaded successfully');
      res.status(200).json({ message: 'Image uploaded successfully' });
  } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
// // Controller for retrieving doctor image
exports.getImage = async (req, res) => {
  try {
      const { id } = req.params;
      const doctor = await Doctor.findByPk(id);

      if (!doctor || !doctor.image) {
          return res.status(404).json({ error: 'Doctor image not found' });
      }

      // Send the image data as response
      res.set('Content-Type', 'image/jpeg'); // Adjust content type based on your image format
      res.send(doctor.image);
  } catch (error) {
      console.error('Error retrieving image:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};



exports.deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if the doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor not found' });
    }

    // Delete the doctor from the database
    await doctor.destroy();

    res.status(200).json({ status: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}

exports.updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { first_name, last_name, email, phone, address, speciality } = req.body;

    // Check if the doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: false, message: 'Doctor not found' });
    }

    // Update the doctor's information
    doctor.first_name = first_name;
    doctor.last_name = last_name;
    doctor.email = email;
    doctor.phone = phone;
    doctor.address = address;
    doctor.speciality = speciality;
    await doctor.save();

    res.status(200).json({ status: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}

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