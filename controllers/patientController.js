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
            return res.status(404).json({ status: false, message: 'Patient does not exist' });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, patient.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ status: false, message: 'Incorrect password' });
        }

        const oneDayInSeconds = 24 * 60 * 60; // 1 day = 24 hours * 60 minutes * 60 seconds
        const expiresIn = 365 * oneDayInSeconds;
        let tokenData;
        tokenData = { id: patient.id_patient, email: patient.email, role: "patient" };
        const token = await PatientServices.generateAccessToken(tokenData, expiresIn);
        const userData = {
            age: patient.age,
            gender: patient.gender,
            diabetes_type: patient.diabetes_type,
            Smokes: patient.Smokes
        };
        // Call Python recommendation script with userData
        const pythonProcess = spawn('python', ['C:/System-Reco/dka.py']);

        // Send user data to Python script
        pythonProcess.stdin.write(JSON.stringify(userData));
        pythonProcess.stdin.end();

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
        console.log('Request Body:', req.body);

        if (!field || !value) {
            console.log('Field or value is missing');
            return res.status(400).json({ message: 'Field or value is missing' });
        }

        // Find the patient by ID
        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            console.log('Patient not found');
            return res.status(404).json({ message: 'Patient not found' });
        }

        if (field.toLowerCase() === 'name') {
            const [firstName, lastName] = value.split(' ');
            if (!firstName || !lastName) {
                console.log('Invalid name format');
                return res.status(400).json({ message: 'Invalid name format' });
            }
            patient['first_name'] = firstName;
            patient['last_name'] = lastName;
        } else {
            const fieldMappings = {
                'phone number': 'phone',
                'date of birth': 'date_of_birth',
            };
            field = fieldMappings[field.toLowerCase()] || field; // Use the mapped field name if available

            // Convert the field name to lowercase
            const lowercaseField = field.toLowerCase();

            // Update patient profile with received data
            patient[lowercaseField] = value;
        }

        await patient.save();
        console.log('Patient profile updated successfully');
        return res.status(200).json({ status: true, message: 'Patient profile updated successfully' });
    } catch (error) {
        console.error('Error updating patient profile:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.modifyPassword = async (req, res) => {
    try {
      const { patientId } = req.params;
      const { currentPassword, newPassword } = req.body;
  
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ status: false, message: 'Patient not found' });
      }
  
      const isPasswordCorrect = await bcrypt.compare(currentPassword, patient.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ status: false, message: 'Incorrect current password' });
      }
  
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
      await Patient.update({ password: hashedNewPassword }, { where: { id_patient: patientId } });
  
      return res.status(200).json({ status: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error modifying password:', error);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }
  };

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

exports.updateFCMToken = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { fcmToken } = req.body;

        console.log('Received patientId:', patientId);
        console.log('Received fcmToken:', fcmToken);

        // Find the patient by ID
        const patient = await Patient.findByPk(patientId);
        console.log('Found patient:', patient);

        if (!patient) {
            console.log('Patient not found');
            return res.status(404).json({ status: false, message: 'Patient not found' });
        }

        console.log('Patient before update:', patient);
        patient.fcm_token = fcmToken;
        console.log('Patient after update:', patient);
        

        await patient.save();
        console.log('Patient saved with updated FCM token');

        return res.status(200).json({ status: true, message: 'FCM token updated successfully' });
    } catch (error) {
        console.error('Error updating FCM token:', error);
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

exports.getPatientsInDanger = async (req, res) => {
    const { doctorId } = req.params;
    try {
      const currentDate = new Date().toISOString().slice(0, 10); // Get current date in 'YYYY-MM-DD' format
  
      const patients = await Patient.findAll({
        where: {
          id_doctor: doctorId
        },
        include: [{
          model: Test,
          where: {
            state: 'danger',
            date: {
              [Op.gte]: new Date(currentDate), // Filter tests by current date or later
              [Op.lt]: new Date(currentDate + 'T23:59:59.999Z') // Filter tests before the next day
            }
          },
          attributes: ['date', 'acetoneqt'], // Select only 'date' and 'acetoneqt' from tests
          required: true // Inner join, will only return patients with matching tests
        }],
        attributes: ['id_patient', 'first_name', 'last_name', 'email'], // Select specific attributes from patients
      });
  
      // Extract relevant patient information
      const formattedPatients = patients.map(patient => ({
        id: patient.id_patient,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        dateOfTest: patient.tests.length > 0 ? patient.tests[0].date : null, 
        acetoneQt: patient.tests.length > 0 ? patient.tests[0].acetoneqt : null 
      }));
  
      res.json(formattedPatients);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  exports.addrecommendation = async (req, res) => { 
    const { typerecommendation, rating, recommendation, age,diabetesType,gender,area,isSmoke, } = req.body;

     // Log gender to the terminal
     console.log(`smoek: ${isSmoke}`);
    const pythonProcess = spawn('python', ['C:\\Users\\GE\\Desktop\\backback\\python\\rec.py',typerecommendation,
        rating,
        recommendation,
        age,
        gender,
        diabetesType,
        isSmoke,
        area]);
    
    let pythonOutput = '';
    
    // Capture stdout data from Python script
    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        pythonOutput += data.toString(); // Append stdout data to the output variable
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    // Handle any errors from Python script execution
    pythonProcess.on('error', (error) => {
        console.error(`Error executing Python script: ${error.message}`);
    });
    
    // When the Python script execution is complete
    pythonProcess.on('close', (code) => {
        console.log(`Python script process exited with code ${code}`);
        res.status(200).json({
            message: 'Successfully added',
            pythonOutput: pythonOutput.trim()
        });
    });
}