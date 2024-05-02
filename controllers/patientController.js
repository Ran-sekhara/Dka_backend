const Patient = require('../models/patient');
const Token = require('../models/token');
const bcrypt = require('bcrypt');
const PatientServices = require('../services/patient.service');
const { generateNewPassword } = require('../utils/passwordUtils.js');
const nodemailer = require('nodemailer');

// Create a Patient
exports.createPatient = async (req, res) => {
    try {
        console.log('Received request to create a new patient:', req.body);

        const { first_name, last_name, email, phone, password,address, date_of_birth, gender,archived, id_doctor,role } = req.body;
        
        // Check if the password meets the minimum length requirement
        if (password.length < 7) {
            return res.status(400).json({ status: false, message: 'Password must be at least 7 characters long' });
        }

        // Check if Patient with the same email already exists
        const existingPatient = await Patient.findOne({ where: { email } });
        if (existingPatient) {
            return res.status(400).json({ status: false, message: `The email ${email} is already registered` });
        }
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new Patient with hashed password
        const patient = await Patient.create({ first_name, last_name, email, phone, date_of_birth, gender, password: hashedPassword,address,archived,id_doctor, role  });
        console.log('Patient created successfully:', patient);
        res.json({ status: true, message: 'Patient registered successfully', id: patient.id_patient });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

// Log in the Patient
exports.loginPatient = async (req, res, next) => {
    try {
        const { email, password } = req.body;

         // Retrieve Patient by email
         const patient = await Patient.findOne({ where: { email } });
         if (!patient) {
             return res.status(401).json({ status: false, message: 'Incorrect email or password' });
         }
 
         // Compare passwords
         const isPasswordCorrect = await bcrypt.compare(password, patient.password);
         if (!isPasswordCorrect) {
             return res.status(401).json({ status: false, message: 'Incorrect email or password' });
         }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        let tokenData;
        tokenData = { id: patient.id_patient, email: patient.email, role: "patient" };
        const token = await PatientServices.generateAccessToken(tokenData, expiresIn);

        res.status(200).json({ status: true, message: 'Successfully logged in', token: token });
    } catch (error) {
        console.error('Error logging in patient:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.getPatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;
        // Retrieve Patient by email
        const patient = await Patient.findOne({ where: { id_patient: patientId} });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient does not exist' });
        }

        // Return the patient details
        res.json({ 
            first_name : patient.first_name,
             last_name: patient.last_name, 
             email: patient.email ,
             password:patient.password, 
             phone:patient.phone,
             address:patient.address,
             date_of_birth:patient.date_of_birth,
             gender:patient.gender

             });
    } catch (error) {
        console.error('Error getting patient profile:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};


exports.verifyToken = async (req, res) => {
    try {
        const { email, codeVerification } = req.body;

        // Find the patient by email
        const patient = await Patient.findOne({ where: { email } });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Email not found.' });
        }

        // Find a token for the patient
        const token = await Token.findOne({ where: { id_patient: patient.id_patient, token: codeVerification } });
        if (!token) {
            // If no matching token found, respond with an error status
            return res.status(404).json({ status: false, message: 'Verification code does not match or has expired.' });
        }

        // If token is found, respond with success status
        res.status(200).json({ status: true, message: 'Verification successful.' });
    } catch (error) {
        console.error('Error during token verification:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, codeVerification } = req.body;

        console.log('Received request to reset password:', { email, newPassword, codeVerification });

        const patient = await Patient.findOne({ where: { email } });
        if (!patient) {
            console.log('Patient not found for email:', email);
            return res.status(404).json({ status: false, message: 'Email not found. Please enter a registered email address.' });
        }

        const token = await Token.findOne({ where: { id_patient: patient.id_patient, token: codeVerification } });
        if (!token) {
            console.log('Token not found or does not match:', { id_patient: patient.id_patient, token: codeVerification });
            return res.status(404).json({ status: false, message: 'Verification code does not match or has expired.' });
        }

        console.log('Deleting token:', token);

        await Token.destroy({ where: { tokenId: token.tokenId } });

        console.log('Token deleted successfully');

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log('Hashed password:', hashedPassword);

        await Patient.update(
            { password: hashedPassword },
            { where: { email } }
        );

        console.log('Password updated successfully');

        return res.status(200).json({ status: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Error during password reset:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.recoverPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const patient = await Patient.findOne({ where: { email } });
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Email not found. Please enter a registered email address.' });
        }

        const existingToken = await Token.findOne({ where: { id_patient: patient.id_patient } });
        if (existingToken) {
            await Token.destroy({ where: { id_patient: patient.id_patient } });
        }

        const verificationCode = Math.floor(10000 + Math.random() * 90000); // Generates a 5-digit code

        await Token.create({
            id_patient: patient.id_patient, // Associate the token with the patient
            token: verificationCode.toString(),
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_User ,
                pass: process.env.PASS_User,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_User,
            to: email,
            subject: 'Verification Code for Password Recovery',
            text: `Your verification code is: ${verificationCode}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ status: false, message: 'Internal server error' });
            }
            console.log('Email sent:', info.response);
            res.json({ status: true, message: 'Verification code sent successfully', verificationCode: verificationCode.toString() });
        });
    } catch (error) {
        console.error('Error during password recovery:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
exports.updatePatientDoctor = async (req, res) => {
    try {
      const { patientId, doctorId } = req.params;
  
      // Find the patient by ID
      const patient = await Patient.findByPk(patientId);
  
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
  
      // Update the patient's doctor
      patient.id_doctor = doctorId;
      await patient.save();
  
      return res.status(200).json({ message: 'Patient doctor updated successfully' });
    } catch (error) {
      console.error('Error updating patient doctor:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  exports.getPatientDetails = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findOne({ where: { id_patient: patientId} });

        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient not found' });
        }

        // Return the patient details
        res.status(200).json({
            id_patient: patient.id_patient,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            gender:patient.gender,
            date_of_birth:patient.date_of_birth
            // Add other fields as needed
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.updatePatientProfile = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        let { field, value } = req.body;

        console.log('Received update request for patient ID:', patientId);
        console.log('Request Body:', req.body); // Log the entire request body

        // Ensure both field and value are present in the request body
        if (!field || !value) {
            console.log('Field or value is missing'); 
            return res.status(400).json({ message: 'Field or value is missing' });
        }

        // Handle special cases where the field corresponds to a combined name
        if (field.toLowerCase() === 'name') {
            const [firstName, lastName] = value.split(' ');
            // Update both first name and last name fields in the database
            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                console.log('Patient not found');
                return res.status(404).json({ message: 'Patient not found' });
            }
            patient['first_name'] = firstName;
            patient['last_name'] = lastName;
            await patient.save();
        } else {
            // Map the field name if needed
            const fieldMappings = {
                'phone number': 'phone',
                'date of birth':'date_of_birth',
                
            };
            field = fieldMappings[field.toLowerCase()] || field; // Use the mapped field name if available

            // Convert the field name to lowercase
            const lowercaseField = field.toLowerCase();

            // Find the patient by ID
            const patient = await Patient.findByPk(patientId);
            if (!patient) {
                console.log('Patient not found');
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Update patient profile with received data
            patient[lowercaseField] = value;
            await patient.save();
        }

        console.log('Patient profile updated successfully');
        return res.status(200).json({ status: true, message: 'Patient profile updated successfully' });
    } catch (error) {
        console.error('Error updating patient profile:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
//exports.updatePatientProfile = async (req, res) => {
  //  try {
       // const patientId = req.params.patientId;
       // const { updatedData } = req.body; // Assuming updatedData is an object containing the fields to update

       // console.log('Received data from front end:', updatedData); // Add a print statement to see the data received from the front end

       // if (!updatedData) {
       //     return res.status(400).json({ status: false, message: 'Updated data is required' });
       // }

        // Print the labels received from the frontend
       // console.log('Labels received from front end:', Object.keys(updatedData));

        // Find the patient by ID
       // const patient = await Patient.findByPk(patientId);
  
       // if (!patient) {
          //  return res.status(404).json({ message: 'Patient not found' });
       // }

        // Update patient profile with received data
       // Object.keys(updatedData).forEach(key => {
       //     if (patient.hasOwnProperty(key)) {
        //        patient[key] = updatedData[key];
         //   }
       // });

      //  await patient.save();
       // console.log('Patient profile updated successfully'); // Add a print statement to indicate successful update
       // return res.status(200).json({ status: true, message: 'Patient profile updated successfully' });
   // } catch (error) {
      //  console.error('Error updating patient profile:', error);
      //  return res.status(500).json({ status: false, message: 'Internal server error' });
   // }
//};

exports.deletePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ status: false, message: 'Patient not found' });
        }
        
        await patient.destroy();

        return res.status(200).json({ status: true, message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};



exports.getAllPatientsProfiles = async (req, res) => {
    try {
        // Retrieve all patients where archived is false
        const patients = await Patient.findAll({
            where: {
                archived: false
            }
        });
        const totalPatients = patients.length;

        // Return an array of patient profiles
        const patientProfiles = patients.map(patient => ({
            id_patient: patient.id_patient,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            date_of_birth:patient.date_of_birth,
            gender:patient.gender
            // Add other fields as needed
        }));
        
        // Return the response including totalPatients and patientProfiles
        const response = {
            totalPatients,
            patientProfiles
        };
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching all patients profiles:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.fetchPatientEmail = async (req, res) => {
    const { patientId } = req.params;
    try {
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      return res.status(200).json({ email: patient.email });
    } catch (error) {
      console.error('Failed to fetch patient email:', error);
      return res.status(500).json({ error: 'Failed to fetch patient email' });
    }
  };
  exports.sendEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body; // Extracting to, subject, and body from the request body

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_User, 
                pass: process.env.PASS_User 
            }
        });

        // Define email options
        const mailOptions = {
            from: process.env.EMAIL_User,
            to: to, 
            subject: subject,
            text: body
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Failed to send email:', error.message);
        res.status(500).json({ error: 'Failed to send email' });
    }
};


exports.archivedPatient = async (req, res) => {
    const { patientId } = req.params;
    console.log('Received request to archive patient with ID:', patientId); // Print received patient ID
  
    try {
      const patient = await Patient.findByPk(patientId);
      console.log('Patient found:', patient); // Print patient object
  
      if (!patient) {
        console.log('Patient not found'); // Print error message
        return res.status(404).json({ error: 'Patient not found' });
      }
  
      // Update the archived field to true
      patient.archived = true;
      await patient.save();
  
      console.log('Patient profile archived successfully'); // Print success message
      res.status(200).json({ message: 'Patient profile archived successfully' });
    } catch (error) {
      console.error('Error archiving patient profile:', error); // Print error message
      res.status(500).json({ error: 'Failed to archive patient profile' });
    }
  };

  exports.unarchivePatient = async (req, res) => {
    const { patientId } = req.params;
    console.log('Received request to unarchive patient with ID:', patientId); // Print received patient ID
  
    try {
      const patient = await Patient.findByPk(patientId);
      console.log('Patient found:', patient); // Print patient object
  
      if (!patient) {
        console.log('Patient not found'); // Print error message
        return res.status(404).json({ error: 'Patient not found' });
      }
  
      // Update the archived field to false
      patient.archived = false;
      await patient.save();
  
      console.log('Patient profile unarchived successfully'); // Print success message
      res.status(200).json({ message: 'Patient profile unarchived successfully' });
    } catch (error) {
      console.error('Error unarchiving patient profile:', error); // Print error message
      res.status(500).json({ error: 'Failed to unarchive patient profile' });
    }
  }; 
  
  exports.getAllArchivedPatients = async (req, res) => {
    try {
        // Retrieve all patients where archived is true
        const archivedPatients = await Patient.findAll({
            where: {
                archived: true
            }
        });

        // Return an array of archived patient profiles
        const archivedPatientProfiles = archivedPatients.map(patient => ({
            id_patient: patient.id_patient,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            gender:patient.gender,
            date_of_birth:patient.date_of_birth
                }));

        // Return the archived patient profiles
        res.status(200).json(archivedPatientProfiles);
    } catch (error) {
        console.error('Error fetching all archived patients:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};
