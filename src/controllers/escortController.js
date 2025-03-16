const Escort = require("../models/Escort");
const { v4: uuidv4 } = require("uuid");

const BASE_URL = "https://escord-backend.onrender.com";

// Function to generate a custom unique ID
const generateUniqueId = (name) => {
  const sanitized_name = name.toLowerCase().replace(/\s+/g, "-"); // Convert name to lowercase & replace spaces with "-"
  
  // Generate a random 4-letter and 4-digit string
  const letters = Math.random().toString(36).substring(2, 6); // Random 4 letters
  const digits = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
  
  return `escort-${sanitized_name}-${letters}${digits}`;
};

exports.registerEscort = async (req, res) => {
  try {
    const {
      name,
      age,
      height,
      chest,
      contact_number,
      whatsapp_number,
      location,
      country,
      state,
      city,
      bio,
      weight,
      services,
      rates
    } = req.body;

    if (!req.files || !req.files["profile_photo"]) {
      return res.status(400).json({ message: "Profile photo is required." });
    }

    // Parse services if they are passed as a stringified array
    let parsedServices = services;
    if (typeof services === 'string') {
      try {
        parsedServices = JSON.parse(services); // Parse the stringified array into a real array
      } catch (error) {
        return res.status(400).json({ message: "Invalid services format" });
      }
    }

    // Ensure rates is parsed into an array of objects if it's a string
    let parsedRates = rates;
    if (typeof rates === 'string') {
      parsedRates = JSON.parse(rates); // Parse the stringified array of rates
    }

    // Generate a unique ID for the escort
    const uniqueId = generateUniqueId(name);

    // Function to format image URLs with domain & folder structure
    const formatFileUrl = (filename) => `${BASE_URL}/uploads/${filename}`;

    // Save profile photo URL
    const profile_photo = formatFileUrl(`images/${req.files["profile_photo"][0].filename}`);

    // Save multiple images URLs
    const images = req.files["images"] ? req.files["images"].map((file) => formatFileUrl(`images/${file.filename}`)) : [];

    // Save single video URL (handle only one video)
    const videos = req.files["videos"] ? [formatFileUrl(`videos/${req.files["videos"][0].filename}`)] : [];

    // Save data in MongoDB
    const escort = new Escort({
      name,
      age,
      height,
      chest,
      contact_number,
      whatsapp_number,
      location,
      country,
      state,
      city,
      bio,
      weight,
      profile_photo,
      images,
      videos,
      services: parsedServices,  // Save services array after parsing
      rates: parsedRates,        // Save rate array of objects after parsing
      uniqueId,
    });

    await escort.save();
    res.status(200).json({ message: "Escort registered successfully", uniqueId: escort.uniqueId });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.filterEscorts = async (req, res) => {
  try {
    const { country, state, city, service } = req.query;
    
    // Ensure at least one of the parameters is provided
    if (!country && !state && !city && !service) {
      return res.status(400).json({ message: "At least one of 'country', 'state', 'city', or 'service' is required." });
    }

    let filter = { status: "approved" };  // Filter for approved escorts
    console.log(service)
    if (!country && !state && !city && !service) {
      return res.status(400).json({ message: "At least one of 'country', 'state', 'city', or 'service' is required."});}
    // Add filters based on location and service  
    if (country) filter.country = country;
    if (state) filter.state = state;
    if (city) filter.city = city;
    if (service) filter.services = { $in: [service] }; // Filter based on services

    // Find the escorts that match the filter
    const escorts = await Escort.find(filter);

    // If no escorts are found, return a custom message with a 200 status
    if (!escorts.length) {
      // Check if the problem is due to no matching services or location
      if (service && !country && !state && !city) {
        return res.status(200).json({ message: `No escorts found offering the service "${service}"` });
      } else if (!service && (country || state || city)) {
        return res.status(200).json({ message: "No escorts found in the specified location" });
      } else {
        return res.status(200).json({ message: "No escorts found matching the given filters" });
      }
    }

    // Return the filtered escorts
    res.status(200).json({ message: "Filtered approved escorts retrieved successfully", escorts });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


// Check Escort Registration Status
exports.checkEscortStatus = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    
    // Find escort by uniqueId and select required fields
    const escort = await Escort.findOne({ uniqueId }).select(
      "name status bio location contact_number uniqueId profile_photo"
    );

    if (!escort) {
      return res.status(200).json({ message: "Escort not found" });
    }

    res.status(200).json({ 
      message: "Registration status retrieved successfully",
      data: escort 
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all escort registrations (Admin Only)
exports.getAllEscorts = async (req, res) => {
  try {
    const escorts = await Escort.find();
    
    if (!escorts.length) {
      return res.status(200).json({ message: "No escorts found" });
    }

    res.status(200).json({ escorts });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all approved escorts
exports.getApprovedEscorts = async (req, res) => {
  try {
    // Find all escorts with status 'approved'
    const escorts = await Escort.find({ status: "approved" });

    if (!escorts.length) {
      return res.status(200).json({ message: "No approved escorts found" });
    }

    res.status(200).json({
      message: "Approved escorts retrieved successfully",
      escorts,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Escort Status (Admin Only)
exports.updateEscortStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const escort = await Escort.findById(id);
    if (!escort) {
      return res.status(200).json({ message: "Escort not found" });
    }

    escort.status = status;
    await escort.save();

    res.status(200).json({ message: `Escort status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
