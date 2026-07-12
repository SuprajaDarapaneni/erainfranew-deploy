import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  CompanyDetails,
  Project,
  LifestyleAmenity,
  Testimonial,
  GalleryItem,
  Inquiry,
  RecentActivity,
  SeoSettings,
  DownloadCount,
  LocalUpload,
  ICompanyDetails,
  IProject,
  ILifestyleAmenity,
  ITestimonial,
  IGalleryItem,
  IInquiry,
  IRecentActivity,
  ISeoSettings,
  IDownloadCount,
  ILocalUpload
} from "./models";

// Load environment variables from .env
dotenv.config();

const ROOT_DIR = process.cwd().endsWith("backend") ? path.join(process.cwd(), "..") : process.cwd();
const BACKEND_DIR = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");

// Parse .env.example if .env does not exist to load local user customization variables securely
const envExamplePath = path.join(ROOT_DIR, ".env.example");
if (fs.existsSync(envExamplePath)) {
  try {
    const envContent = fs.readFileSync(envExamplePath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const equalsIdx = trimmed.indexOf("=");
        const key = trimmed.substring(0, equalsIdx).trim();
        let val = trimmed.substring(equalsIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (err) {
    console.error("Failed to parse .env.example loader", err);
  }
}

// Define the store file location
const STORE_DIR = path.join(ROOT_DIR, "data");
const STORE_FILE = path.join(STORE_DIR, "store.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const PUBLIC_UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");
const BACKEND_PUBLIC_UPLOADS_DIR = path.join(BACKEND_DIR, "public", "uploads");

// Ensure directories exist
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKEND_PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(BACKEND_PUBLIC_UPLOADS_DIR, { recursive: true });
}

// Initial data schema loaded if database is empty
const INITIAL_DATA = {
  companyDetails: {
    name: "ERA INFRA DEVELOPERS",
    alias: "ERA INFRA",
    slogan: "Low Price Plots and Resorts in Best Locations.",
    subtitle: "Resorts ★ Open Plots ★ Farm Lands",
    mdName: "Ravi Kiran Guthikonda",
    mdRole: "Chairman",
    phone1: "9885245679",
    phone2: "9440118888",
    email: "sales@erainfradevelopers.com",
    address: "# 40-9-87/2, House No: 22, 2nd Line, Sai Nagar Near Benz Circle, Vijayawada - 520 008.",
    stats: [
      { label: "Years of Experience", value: 12, suffix: "+" },
      { label: "Projects Finished", value: 0, suffix: "" },
      { label: "Happy Customers", value: 0, suffix: "+" },
      { label: "Acres Land Developed", value: 0, suffix: " Acres" }
    ],
    aboutStory: "ERA INFRA DEVELOPERS is a very trusted company in Vijayawada.",
    vision: "To provide world-class gated communities, premium open plots, and scenic resort farm lands at affordable price points with absolute transparency and clear documents.",
    mission: "To help thousands of families secure their high-return real estate investments with pristine development quality and hassle-free registration processes in the best growing locations.",
    headerVideo: "/uploads/township_drone.mp4",
    founderName: "Ravi Kiran Guthikonda",
    founderImage: "/uploads/founder_portrait.jpeg",
    founderBio: "Ravi Kiran Guthikonda is the Managing Director of ERA INFRA. He has more than 12 years of experience in Vijayawada real estate. He works very hard to give clear documents, easy registration, and beautiful layouts with plants and trees. He already helped more than 1200 families to buy premium lands at low budget. His new project Green Gold Valley is very popular.",
    founderQuote: "We do not just sell plots. We build long-term trust with our customer families. All our layouts have sweet drinking water, electricity, strong compound walls, wide roads, and 24-hours gate security so your land is 100% safe.",
    slides: [
      {
        id: "slide-uploaded",
        title: "Premium Gated Community Tour",
        subtitle: "Experience high-quality living spaces with pristine layouts, sweet drinking water, and legally secure plots.",
        mediaUrl: "/uploads/13930058_1920_1080_60fps_1.mp4",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Discover Luxury Living"
      },
      {
        id: "slide-image-1",
        title: "Prestigious Green Gold Valley",
        subtitle: "Own premium resort lands with organic mango plantations, 24/7 security, and modern clubhouse access.",
        mediaUrl: "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=1920&q=80",
        mediaType: "image",
        fallbackImage: "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=1920&q=80",
        buttonText: "View Luxury Layout"
      },
      {
        id: "slide-5",
        title: "Wooden Farmhouse & Weekend Resorts",
        subtitle: "Unwind in your organic cottage estate, complete with sweet water and 24/7 boundary security.",
        mediaUrl: "https://player.vimeo.com/external/517617466.sd.mp4?s=efdb13583ab945372338ecfbc2961fe04bcbc8c0&profile_id=165&oauth2_token_id=57447761",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Explore Resort Farmlands"
      },
      {
        id: "slide-image-2",
        title: "Premium Resort Living & Farms",
        subtitle: "Unmatched aesthetic, high-standard construction, and standard gated amenities.",
        mediaUrl: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1920&q=80",
        mediaType: "image",
        fallbackImage: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Request Brochure"
      },
      {
        id: "slide-1",
        title: "Lush Gated Resort & Farm Lands",
        subtitle: "Sustainably designed gated mango groves with premium resort living near Vijayawada.",
        mediaUrl: "https://player.vimeo.com/external/354217109.sd.mp4?s=84566d7fe997cb24fef77b1e4277bdf91e3e8f81&profile_id=165&oauth2_token_id=57447761",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Explore Golden Farmlands"
      },
      {
        id: "slide-image-3",
        title: "Signature Gated Community Plots",
        subtitle: "Secure gated layout developments with high investment return potential near commercial hubs.",
        mediaUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
        mediaType: "image",
        fallbackImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
        buttonText: "See Plot Pricing"
      },
      {
        id: "slide-3",
        title: "Signature Gated Community Plots",
        subtitle: "Own legally secure, ready-to-construct villa plots in emerging inner ring growth zones.",
        mediaUrl: "https://player.vimeo.com/external/434045526.sd.mp4?s=c27d2ad48cb7e339de79115b395ae2140b63ec0f&profile_id=165&oauth2_token_id=57447761",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80",
        buttonText: "View Investment Layouts"
      },
      {
        id: "slide-image-4",
        title: "Pristine Luxury Investment Plots",
        subtitle: "High-yield layout plots near Mallavalli Industrial Corridor & Outer Ring Road (ORR).",
        mediaUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80",
        mediaType: "image",
        fallbackImage: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Book Site Visit"
      },
      {
        id: "slide-2",
        title: "Low-Budget Luxury Gated Schemes",
        subtitle: "Resorts ★ Open Plots ★ Farm Lands in Vijayawada",
        mediaUrl: "/uploads/township_drone.mp4",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Explore Gated Schemes"
      },
      {
        id: "slide-4",
        title: "Pristine Luxury Investment Plots",
        subtitle: "Pristine layouts near Mallavalli Industrial Corridor & ORR",
        mediaUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054e54508d11d4d9de8e17b3f9ffc12&profile_id=165&oauth2_token_id=57447761",
        mediaType: "video",
        fallbackImage: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1920&q=80",
        buttonText: "Villas & Plots"
      }
    ]
  },
  projects: [],
  lifestyleAmenities: [],
  testimonials: [],
  galleryItems: [],
  inquiries: [],
  recentActivities: [],
  seoSettings: {
    home: { title: "Era Infra Developers | Resorts, Plots & Luxury Villas in Vijayawada", description: "Approved gated open plot layouts and premium resort land communities near Vijayawada. Explore Era properties now." },
    about: { title: "About Era Infra Developers", description: "Learn about Era Infra Developers." },
    projects: { title: "Signature Developments", description: "Explore beautiful plots, luxury villas, and organic resort lands." },
    contact: { title: "Contact Us", description: "Get in touch with Era Infra Developers." }
  },
  downloadCount: 0
};

// Initialize Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("[Cloudinary] Credentials initialized successfully.");
} else {
  console.warn("[Cloudinary] Credentials missing in environment variables. Uploads will fall back to local disk.");
}

// Helpers for Cloudinary integration to fetch and manage gallery items directly in Cloudinary
function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    
    const pathAfterUpload = parts[1];
    const cleanPath = pathAfterUpload.replace(/^v\d+\//, "");
    
    const lastDotIndex = cleanPath.lastIndexOf(".");
    const publicId = lastDotIndex !== -1 ? cleanPath.substring(0, lastDotIndex) : cleanPath;
    
    return publicId;
  } catch (err) {
    console.error("Failed to parse public ID from URL:", url, err);
    return null;
  }
}

async function fetchGalleryFromCloudinary(): Promise<any[]> {
  const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (!cloudinaryConfigured) {
    console.warn("[Cloudinary] Credentials missing. Returning empty gallery.");
    return [];
  }

  try {
    console.log("[Cloudinary] Fetching resources from Cloudinary with prefix 'era_infra/'...");
    let result = await cloudinary.api.resources({
      type: "upload",
      prefix: "era_infra/",
      context: true,
      max_results: 100
    });

    if (!result || !result.resources || result.resources.length === 0) {
      console.log("[Cloudinary] No resources found with prefix 'era_infra/'. Trying all upload resources...");
      result = await cloudinary.api.resources({
        type: "upload",
        context: true,
        max_results: 100
      });
    }

    if (result && result.resources) {
      console.log(`[Cloudinary] Found ${result.resources.length} resources.`);
      return result.resources.map((resource: any) => {
        let title = "Site View";
        let category = "site";
        let projectId = "";

        if (resource.context && resource.context.custom) {
          title = resource.context.custom.title || title;
          category = resource.context.custom.category || category;
          projectId = resource.context.custom.projectId || projectId;
        } else if (resource.context) {
          title = resource.context.title || title;
          category = resource.context.category || category;
          projectId = resource.context.projectId || projectId;
        }

        return {
          id: resource.public_id,
          title: title,
          category: category,
          image: resource.secure_url,
          projectId: projectId
        };
      });
    }
  } catch (err: any) {
    console.error("[Cloudinary] Failed to fetch gallery resources:", err.message || err);
  }
  return [];
}

// Connect to MongoDB
let rawMongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/era-infra";
rawMongoUri = rawMongoUri.trim();
if (rawMongoUri.startsWith("MONGO_URL=")) {
  rawMongoUri = rawMongoUri.substring("MONGO_URL=".length).trim();
} else if (rawMongoUri.startsWith("MONGODB_URI=")) {
  rawMongoUri = rawMongoUri.substring("MONGODB_URI=".length).trim();
}
const mongoUri = rawMongoUri;
console.log("[MongoDB] Connecting to database...");

let isMongoConnected = false;
mongoose.set("bufferCommands", false); // CRITICAL: fail fast, don't hang

mongoose.connection.on("connected", () => {
  console.log("[MongoDB] Connection event: Connected.");
  isMongoConnected = true;
});
mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Connection event: Disconnected. Falling back to local storage.");
  isMongoConnected = false;
});

mongoose.connect(mongoUri)
  .then(() => {
    console.log("[MongoDB] Connected successfully to database.");
    isMongoConnected = true;
  })
  .catch((err) => {
    console.warn("[MongoDB] Connection failure. Falling back to local store.json storage:", err.message);
    isMongoConnected = false;
  });

function getLocalData() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading local store", err);
  }
  return INITIAL_DATA;
}

function saveLocalData(data: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local store", err);
  }
}

function updateLocalStore(collection: string, action: "create" | "update" | "delete", filter: any, updateObj?: any) {
  try {
    const data = getLocalData();
    if (!data[collection]) data[collection] = [];
    
    if (action === "create") {
      data[collection].push(updateObj);
    } else if (action === "update") {
      const idx = data[collection].findIndex((x: any) => x.id === filter.id);
      if (idx !== -1) {
        data[collection][idx] = { ...data[collection][idx], ...updateObj };
      }
    } else if (action === "delete") {
      data[collection] = data[collection].filter((x: any) => x.id !== filter.id);
    }
    saveLocalData(data);
  } catch (err) {
    console.error("Failed to update local store fallback", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Pre-load from MongoDB if connection is ready (or wait for it briefly)
  try {
    console.log("[MongoDB] Checking connection for pre-loading site data...");
    if (mongoose.connection.readyState !== 1) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          console.warn("[MongoDB] Connection timeout during startup. Proceeding.");
          resolve();
        }, 2000);
        mongoose.connection.once("connected", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState === 1) {
      console.log("[MongoDB] Connection open. Checking seeding condition...");
      const companyCount = await CompanyDetails.countDocuments();
      if (companyCount === 0) {
        console.log("[MongoDB] Database is completely empty. Seeding INITIAL_DATA...");
        
        // Seed INITIAL_DATA collections
        await CompanyDetails.create(INITIAL_DATA.companyDetails);
        
        if (INITIAL_DATA.projects && INITIAL_DATA.projects.length > 0) {
          await Project.create(INITIAL_DATA.projects);
        }
        if (INITIAL_DATA.lifestyleAmenities && INITIAL_DATA.lifestyleAmenities.length > 0) {
          await LifestyleAmenity.create(INITIAL_DATA.lifestyleAmenities);
        }
        if (INITIAL_DATA.testimonials && INITIAL_DATA.testimonials.length > 0) {
          await Testimonial.create(INITIAL_DATA.testimonials);
        }
        if (INITIAL_DATA.galleryItems && INITIAL_DATA.galleryItems.length > 0) {
          await GalleryItem.create(INITIAL_DATA.galleryItems);
        }
        if (INITIAL_DATA.inquiries && INITIAL_DATA.inquiries.length > 0) {
          await Inquiry.create(INITIAL_DATA.inquiries);
        }
        if (INITIAL_DATA.recentActivities && INITIAL_DATA.recentActivities.length > 0) {
          await RecentActivity.create(INITIAL_DATA.recentActivities);
        }
        if (INITIAL_DATA.seoSettings) {
          await SeoSettings.create(INITIAL_DATA.seoSettings);
        }
        await DownloadCount.create({ count: INITIAL_DATA.downloadCount || 42 });
        
        console.log("[MongoDB] Seeding INITIAL_DATA successfully completed.");
      } else {
        console.log("[MongoDB] Existing database found. Skipping default seeding.");
      }
    }
  } catch (err) {
    console.error("[MongoDB] Error during startup seeding check:", err);
  }

  // Configure maximum body size for raw base64 image streams
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Enable CORS middleware so Vercel client can query Render server seamlessly
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // --- ADMIN SESSION AUTHENTICATION ---
  // Every previous "admin" route had zero server-side auth enforcement: the login
  // endpoint handed back a fixed, guessable token string but nothing ever checked
  // it again, so any client (or bot/scanner on the internet) could call the write
  // endpoints directly — including /api/admin/clear-all-data — with no login at all.
  // This is almost certainly why records disappeared: it takes just one unauthenticated
  // POST to wipe Projects/Testimonials/Gallery/Amenities/CompanyDetails/SEO out of MongoDB,
  // while Cloudinary assets stay untouched (that handler never calls cloudinary.destroy).
  interface AdminSession {
    email: string;
    role: string;
    name: string;
    expiresAt: number;
  }
  const activeAdminSessions = new Map<string, AdminSession>();
  const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  const issueSessionToken = (user: { email: string; role: string; name: string }): string => {
    const token = crypto.randomBytes(32).toString("hex");
    activeAdminSessions.set(token, { ...user, expiresAt: Date.now() + SESSION_TTL_MS });
    return token;
  };

  // Periodically sweep expired sessions so the in-memory map doesn't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of activeAdminSessions.entries()) {
      if (session.expiresAt < now) activeAdminSessions.delete(token);
    }
  }, 30 * 60 * 1000);

  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing admin session token. Please log in again." });
    }
    const session = activeAdminSessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      activeAdminSessions.delete(token);
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }
    (req as any).adminUser = session;
    next();
  };

  // Very basic login rate limiting to slow down credential brute-forcing
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const isLoginRateLimited = (ip: string): boolean => {
    const entry = loginAttempts.get(ip);
    const now = Date.now();
    if (!entry || entry.resetAt < now) {
      loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
      return false;
    }
    entry.count += 1;
    return entry.count > 10;
  };

  // Static uploads directory serving link
  app.get("/uploads/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const destPath = path.join(UPLOADS_DIR, filename);

      // 1. If it exists on disk, serve it immediately
      if (fs.existsSync(destPath)) {
        return res.sendFile(destPath);
      }

      // 2. If it does not exist on disk, check MongoDB to restore it
      try {
        const fileDoc = await LocalUpload.findOne({ filename });
        if (fileDoc && fileDoc.base64Data) {
          const buffer = Buffer.from(fileDoc.base64Data, "base64");
          
          // Ensure local uploads directory exists
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          
          // Write to disk so subsequent requests serve it instantly
          fs.writeFileSync(destPath, buffer);
          console.log(`[MongoDB] Successfully restored file ${filename} to disk from MongoDB.`);
          
          if (fileDoc.contentType) {
            res.setHeader("Content-Type", fileDoc.contentType);
          }
          return res.send(buffer);
        }
      } catch (fErr: any) {
        console.error(`[MongoDB] Error recovering file ${filename} from database:`, fErr.message);
      }

      // 3. Fallback to 404
      res.status(404).send("File not found");
    } catch (err: any) {
      console.error("[Uploads Serving] Error serving file:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // --- API ROUTING SECTION ---

  // Standard health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Fetch all site configuration structures
  app.get("/api/site-data", async (req, res) => {
    try {
      if (isMongoConnected) {
        const company = await CompanyDetails.findOne().lean();
        const projects = await Project.find().lean();
        const amenities = await LifestyleAmenity.find().lean();
        const testimonials = await Testimonial.find().lean();
        const gallery = await GalleryItem.find().lean();
        const inquiries = await Inquiry.find().lean();
        const activities = await RecentActivity.find().sort({ timestamp: -1 }).limit(50).lean();
        const seo = await SeoSettings.findOne().lean();
        const downloads = await DownloadCount.findOne().lean();

        const cleanCompany = company ? (({ _id, __v, ...rest }: any) => rest)(company) : {};
        const cleanSeo = seo ? (({ _id, __v, ...rest }: any) => rest)(seo) : {};
        const cleanProjects = projects ? projects.map(({ _id, __v, ...rest }: any) => rest) : [];
        const cleanAmenities = amenities ? amenities.map(({ _id, __v, ...rest }: any) => rest) : [];
        const cleanTestimonials = testimonials ? testimonials.map(({ _id, __v, ...rest }: any) => rest) : [];
        const cleanGallery = gallery ? gallery.map(({ _id, __v, ...rest }: any) => rest) : [];
        const cleanInquiries = inquiries ? inquiries.map(({ _id, __v, ...rest }: any) => rest) : [];
        const cleanActivities = activities ? activities.map(({ _id, __v, ...rest }: any) => rest) : [];

        return res.json({
          companyDetails: cleanCompany,
          projects: cleanProjects,
          lifestyleAmenities: cleanAmenities,
          testimonials: cleanTestimonials,
          galleryItems: cleanGallery,
          inquiries: cleanInquiries,
          recentActivities: cleanActivities,
          seoSettings: cleanSeo,
          downloadCount: downloads ? downloads.count : 42
        });
      }
    } catch (err: any) {
      console.warn("MongoDB fetch failed, falling back to local file-based storage:", err.message || err);
    }

    // Local file fallback
    try {
      const localData = getLocalData();
      return res.json({
        companyDetails: localData.companyDetails || {},
        projects: localData.projects || [],
        lifestyleAmenities: localData.lifestyleAmenities || [],
        testimonials: localData.testimonials || [],
        galleryItems: localData.galleryItems || [],
        inquiries: localData.inquiries || [],
        recentActivities: localData.recentActivities || [],
        seoSettings: localData.seoSettings || {},
        downloadCount: localData.downloadCount !== undefined ? localData.downloadCount : 42
      });
    } catch (fallbackErr: any) {
      console.error("Local store reading failed:", fallbackErr.message);
      return res.json(INITIAL_DATA);
    }
  });

  // General public inquiry posting
  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, phone, email, projectSelected, propertyType, budget, message, visitDate } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone number fields are mandatory." });
      }

      const inqData = {
        id: "inq-" + Date.now(),
        name,
        phone,
        email: email || "N/A",
        projectSelected: projectSelected || "General Custom Inquiry",
        propertyType: propertyType || "Plots",
        budget: budget || "Under ₹50 Lakhs",
        message: message || "Interested, request urgent call-back.",
        visitDate: visitDate || "",
        timestamp: new Date().toISOString(),
        status: "Pending",
        contacted: false
      };

      let newInq = inqData;
      if (isMongoConnected) {
        try {
          newInq = await Inquiry.create(inqData);
        } catch (mongoErr: any) {
          console.warn("MongoDB failed to create inquiry, falling back to local storage:", mongoErr.message);
        }
      }

      // Always write to local JSON as persistent backup/main storage
      updateLocalStore("inquiries", "create", { id: newInq.id }, newInq);

      // Create a recent activity logger line
      const activityText = visitDate 
        ? `Site visit booked by ${name} for "${newInq.projectSelected}" on ${visitDate}`
        : `New callback request submitted by ${name} for "${newInq.projectSelected}"`;

      const activityData = {
        id: "act-" + Date.now(),
        text: activityText,
        type: visitDate ? "booking" : "contact",
        timestamp: new Date().toISOString()
      };

      let newActivity = activityData;
      if (isMongoConnected) {
        try {
          newActivity = await RecentActivity.create(activityData);
          // Keep recent activities capped to 50 in Mongo
          const count = await RecentActivity.countDocuments();
          if (count > 50) {
            const oldest = await RecentActivity.find().sort({ timestamp: 1 }).limit(count - 50);
            if (oldest.length > 0) {
              await RecentActivity.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
            }
          }
        } catch (mongoErr: any) {
          console.warn("MongoDB failed to log activity:", mongoErr.message);
        }
      }

      // Always update local activities
      updateLocalStore("recentActivities", "create", { id: newActivity.id }, newActivity);

      // Cap local activities to 50
      try {
        const localData = getLocalData();
        if (localData.recentActivities && localData.recentActivities.length > 50) {
          localData.recentActivities = localData.recentActivities.slice(-50);
          saveLocalData(localData);
        }
      } catch (e) {}

      res.status(201).json({ success: true, inquiry: newInq });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Track the brochure download counter
  app.post("/api/track-brochure-download", async (req, res) => {
    try {
      const { projectName } = req.body;
      let count = 42;

      if (isMongoConnected) {
        try {
          const downloads = await DownloadCount.findOneAndUpdate({}, { $inc: { count: 1 } }, { upsert: true, new: true });
          if (downloads) count = downloads.count;
        } catch (mongoErr: any) {
          console.warn("MongoDB failed to track brochure download:", mongoErr.message);
        }
      } else {
        try {
          const localData = getLocalData();
          localData.downloadCount = (localData.downloadCount || 0) + 1;
          saveLocalData(localData);
          count = localData.downloadCount;
        } catch (e) {}
      }
      
      const activityData = {
        id: "act-" + Date.now(),
        text: `Brochure pdf downloaded for project "${projectName || "General Portfolio"}"`,
        type: "system",
        timestamp: new Date().toISOString()
      };

      if (isMongoConnected) {
        try {
          await RecentActivity.create(activityData);
        } catch (e) {}
      }
      updateLocalStore("recentActivities", "create", { id: activityData.id }, activityData);

      res.json({ success: true, currentCount: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth credentials verification
  app.post("/api/admin/login", (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (isLoginRateLimited(clientIp)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
    }

    const { email, password } = req.body;

    // Credentials now MUST come from environment variables in production. The old
    // hardcoded "admin123"/"admin" fallbacks are only used in local development
    // (no NODE_ENV=production) so a forgotten .env can never leave the live site
    // protected by a guessable default password.
    const isProduction = process.env.NODE_ENV === "production";
    const secureAdminEmail = process.env.ADMIN_EMAIL || (isProduction ? undefined : "admin@erainfra.com");
    const secureAdminPassword = process.env.ADMIN_PASSWORD || (isProduction ? undefined : "admin123");

    if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
      console.error("[Auth] ADMIN_EMAIL / ADMIN_PASSWORD are not set in production environment variables. Admin login is disabled until these are configured.");
      return res.status(500).json({ error: "Admin login is not configured on the server. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables." });
    }

    // Super Admin
    if (secureAdminEmail && secureAdminPassword && email === secureAdminEmail && password === secureAdminPassword) {
      const user = { email: secureAdminEmail, role: "Super Admin", name: "Ravi Kiran (MD)" };
      const token = issueSessionToken(user);
      return res.json({ success: true, user, token });
    }

    // Content Manager Credentials
    const managerEmail = process.env.MANAGER_EMAIL || (isProduction ? undefined : "manager@erainfra.com");
    const managerPassword = process.env.MANAGER_PASSWORD || (isProduction ? undefined : "manager123");
    if (managerEmail && managerPassword && email === managerEmail && password === managerPassword) {
      const user = { email, role: "Content Manager", name: "Desk Coordinator" };
      const token = issueSessionToken(user);
      return res.json({ success: true, user, token });
    }

    return res.status(401).json({ error: "Invalid login email or password." });
  });

  // Logout: invalidate the session token server-side
  app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) activeAdminSessions.delete(token);
    res.json({ success: true });
  });

  // Database and storage connectivity diagnostic check API
  app.get("/api/admin/db-status", requireAdminAuth, async (req, res) => {
    try {
      const storePath = STORE_FILE;
      const storeSize = fs.existsSync(storePath) ? fs.statSync(storePath).size : 0;
      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      
      let mongoStatus = "Disconnected";
      let mongoConnected = false;
      if (mongoose.connection.readyState === 1) {
        mongoStatus = "Connected (Read/Write OK)";
        mongoConnected = true;
      } else if (mongoose.connection.readyState === 2) {
        mongoStatus = "Connecting";
      }

      let cloudinaryStatus = "Not Configured";
      if (cloudinaryConfigured) {
        cloudinaryStatus = `Configured (Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME})`;
      }

      res.json({
        success: true,
        mongoStatus: mongoStatus,
        mongoUri: mongoUri ? mongoUri.replace(/:([^:@]+)@/, ":****@") : "Not Configured",
        isFallback: !mongoConnected,
        storeSize: storeSize,
        environmentCheck: {
          mongodb: mongoConnected,
          cloudinary: cloudinaryConfigured,
          localUploads: fs.existsSync(UPLOADS_DIR),
          port: PORT,
          nodeEnv: process.env.NODE_ENV || "development"
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API to completely clear all dynamic data collections for a clean start
  app.post("/api/admin/clear-all-data", requireAdminAuth, async (req, res) => {
    try {
      // Extra safety: this is destructive and irreversible, so require the admin
      // to re-enter their password in the request body on top of a valid session.
      const { confirmPassword } = req.body || {};
      const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin123");
      if (!expectedPassword || confirmPassword !== expectedPassword) {
        return res.status(403).json({ error: "Incorrect confirmation password. Data was not cleared." });
      }

      console.log(`[MongoDB] Admin (${(req as any).adminUser?.email}) requested wiping all dynamic database records...`);
      
      // Delete all records from user-controlled collections
      await Project.deleteMany({});
      await LifestyleAmenity.deleteMany({});
      await Testimonial.deleteMany({});
      await GalleryItem.deleteMany({});
      await Inquiry.deleteMany({});
      await RecentActivity.deleteMany({});
      
      // Reset CompanyDetails to clean slate
      await CompanyDetails.deleteMany({});
      await CompanyDetails.create(INITIAL_DATA.companyDetails);
      
      // Reset SEO Settings
      await SeoSettings.deleteMany({});
      await SeoSettings.create(INITIAL_DATA.seoSettings);

      // Reset brochure download count
      await DownloadCount.deleteMany({});
      await DownloadCount.create({ count: 0 });

      console.log("[MongoDB] All collections cleared successfully.");
      res.json({ success: true, message: "Database wiped and reset to clean slate successfully." });
    } catch (err: any) {
      console.error("[MongoDB] Failed to clear all data:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Update complete company profile (CMS)
  app.put("/api/admin/company", requireAdminAuth, async (req, res) => {
    try {
      const updateData = req.body;
      
      const company = await CompanyDetails.findOneAndUpdate({}, { $set: updateData }, { upsert: true, new: true });
      
      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: "Company profile details & CMS static blocks saved",
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, companyDetails: company });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Projects - Create new project
  app.post("/api/admin/projects", requireAdminAuth, async (req, res) => {
    try {
      const project = req.body;
      if (!project.name) {
        return res.status(400).json({ error: "Project name is mandatory." });
      }

      const slug = (project.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      const newProj = await Project.create({
        id: "era-" + (project.id || slug || Date.now().toString()),
        name: project.name,
        location: project.location || "Vijayawada",
        type: project.type || "Plots",
        priceRange: project.priceRange || "₹30 Lakhs - ₹60 Lakhs",
        priceMin: Number(project.priceMin) || 30,
        amenities: Array.isArray(project.amenities) ? project.amenities : [],
        status: project.status || "Pre-Launch",
        image: project.image || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
        images: Array.isArray(project.images) ? project.images : [],
        description: project.description || "Premium property layout designed by Era Infra Developers",
        acres: project.acres || "15 Acres",
        units: project.units || "100 Units",
        sizeRange: project.sizeRange || "150 - 300 Sq.Yards",
        reraNo: project.reraNo || "",
        mapLink: project.mapLink || "",
        originalFeatured: !!project.originalFeatured,
        brochureUrl: project.brochureUrl || ""
      });

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: `New project "${newProj.name}" added to signature collection`,
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.status(201).json({ success: true, project: newProj });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Projects - Edit project
  app.put("/api/admin/projects/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const projectData = req.body;
      
      const existing = await Project.findOne({ id });
      if (!existing) {
        return res.status(404).json({ error: "Project layout parameters not found." });
      }

      const updateFields: any = {
        name: projectData.name || existing.name,
        location: projectData.location || existing.location,
        type: projectData.type || existing.type,
        priceRange: projectData.priceRange || existing.priceRange,
        priceMin: projectData.priceMin !== undefined ? Number(projectData.priceMin) : existing.priceMin,
        amenities: Array.isArray(projectData.amenities) ? projectData.amenities : existing.amenities,
        status: projectData.status || existing.status,
        image: projectData.image || existing.image,
        images: Array.isArray(projectData.images) ? projectData.images : existing.images,
        description: projectData.description || existing.description,
        acres: projectData.acres || existing.acres,
        units: projectData.units || existing.units,
        sizeRange: projectData.sizeRange || existing.sizeRange,
        reraNo: projectData.reraNo !== undefined ? projectData.reraNo : existing.reraNo,
        mapLink: projectData.mapLink !== undefined ? projectData.mapLink : existing.mapLink,
        originalFeatured: projectData.originalFeatured !== undefined ? !!projectData.originalFeatured : existing.originalFeatured,
        brochureUrl: projectData.brochureUrl !== undefined ? projectData.brochureUrl : existing.brochureUrl
      };

      const updated = await Project.findOneAndUpdate({ id }, { $set: updateFields }, { new: true });

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: `Project layout "${updated ? updated.name : ""}" updated successfully`,
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, project: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Projects - Delete project
  app.delete("/api/admin/projects/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const project = await Project.findOneAndDelete({ id });
      if (!project) {
        return res.status(404).json({ error: "Project not found or already deleted." });
      }

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: `Removed project layout "${project.name}" from dynamic portfolio listings`,
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: `Project ${id} removed.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Base64 file uploader handler with persistent Cloudinary storage and local disk fallback
  app.post("/api/admin/upload", requireAdminAuth, async (req, res) => {
    try {
      const { filename, base64Data, contentType } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: "Filename and base64Data fields are required." });
      }

      // Strip metadata prefixes if present (handles any file type MIME formatting)
      const cleanBase64 = base64Data.replace(/^data:.+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      
      // Sanitise filename to fit clean paths
      const safeName = Date.now() + "_" + filename.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const destPath = path.join(UPLOADS_DIR, safeName);
      
      // Ensure local uploads directory exists
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      // Always save a local copy to ensure server-side fallback serving is guaranteed
      fs.writeFileSync(destPath, buffer);

      // Save additional local copies to public/uploads and backend/public/uploads folders to make sure the website reflects them instantly
      try {
        const rootPublicPath = path.join(PUBLIC_UPLOADS_DIR, safeName);
        fs.writeFileSync(rootPublicPath, buffer);
        console.log(`[Local Uploads] Successfully stored copy in root public/uploads: ${safeName}`);
      } catch (err: any) {
        console.warn(`[Local Uploads] Could not write to root public/uploads:`, err.message);
      }

      try {
        const backendPublicPath = path.join(BACKEND_PUBLIC_UPLOADS_DIR, safeName);
        fs.writeFileSync(backendPublicPath, buffer);
        console.log(`[Local Uploads] Successfully stored copy in backend/public/uploads: ${safeName}`);
      } catch (err: any) {
        console.warn(`[Local Uploads] Could not write to backend/public/uploads:`, err.message);
      }

      // Persist the file base64 data to MongoDB for permanent preservation (up to 12MB, MongoDB document limit is 16MB)
      if (buffer.length < 12 * 1024 * 1024) {
        try {
          await LocalUpload.create({
            filename: safeName,
            base64Data: cleanBase64,
            contentType: contentType || "image/jpeg",
            uploadedAt: new Date().toISOString()
          });
          console.log(`[MongoDB] Successfully persisted file ${safeName} in MongoDB (${buffer.length} bytes).`);
        } catch (fErr: any) {
          console.error(`[MongoDB] Failed to persist file ${safeName} in MongoDB:`, fErr.message);
        }
      } else {
        console.warn(`[MongoDB] File ${safeName} exceeds 12MB limit (${buffer.length} bytes). Ephemeral disk storage only.`);
      }
      
      let fileUrl = "";
      let uploadedToStorage = false;

      // Determine absolute fallback URL in case Cloudinary is not configured or fails
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const fallbackUrl = `${protocol}://${req.headers.host}/uploads/${safeName}`;
      fileUrl = fallbackUrl;

      // Prioritize Cloudinary upload
      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      if (cloudinaryConfigured) {
        try {
          let uploadInput = base64Data;
          if (!uploadInput.startsWith("data:")) {
            const mime = contentType || "image/jpeg";
            uploadInput = `data:${mime};base64,${base64Data}`;
          }

          console.log(`[Cloudinary] Uploading ${safeName} to Cloudinary...`);
          const result = await cloudinary.uploader.upload(uploadInput, {
            folder: "era_infra",
            public_id: path.parse(safeName).name,
            resource_type: "auto"
          });

          if (result && result.secure_url) {
            fileUrl = result.secure_url;
            uploadedToStorage = true;
            console.log(`[Cloudinary] Upload successful! URL: ${fileUrl}`);
          }
        } catch (cloudinaryErr: any) {
          console.warn("[Cloudinary] Could not upload to Cloudinary, falling back to local files:", cloudinaryErr?.message || cloudinaryErr);
        }
      }

      // Return accessible URL path (either Cloudinary URL or local uploads fallback path)
      res.json({ success: true, fileUrl, filename: safeName });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inquiries - Update status / mark contacted
  app.put("/api/admin/inquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, contacted } = req.body;

      const existing = await Inquiry.findOne({ id });
      if (!existing) {
        return res.status(404).json({ error: "Inquiry item not found." });
      }

      const updateFields: any = {};
      if (status !== undefined) {
        updateFields.status = status;
      }
      if (contacted !== undefined) {
        updateFields.contacted = !!contacted;
      }

      const updated = await Inquiry.findOneAndUpdate({ id }, { $set: updateFields }, { new: true });

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: `Inquiry status changed for "${updated ? updated.name : ""}"`,
        type: "contact",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, inquiry: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inquiries - Delete inquiry
  app.delete("/api/admin/inquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Inquiry.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ error: "Inquiry item not found." });
      }
      
      res.json({ success: true, message: `Inquiry ${id} deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic Amenities - Add/Delete/Edit
  app.post("/api/admin/lifestyle-amenities", requireAdminAuth, async (req, res) => {
    try {
      const { title, category, description, image } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Amenity title is required." });
      }
      
      const newAmenity = await LifestyleAmenity.create({
        id: "amenity-" + Date.now(),
        title,
        category: category || "Clubhouse",
        description: description || "Premium amenities spec",
        image: image || "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80"
      });

      res.status(201).json({ success: true, amenity: newAmenity });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/lifestyle-amenities/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await LifestyleAmenity.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ error: "Amenity not found or already deleted." });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Testimonials - Create, edit, hide, delete
  app.post("/api/admin/testimonials", requireAdminAuth, async (req, res) => {
    try {
      const { name, role, content, rating, avatar, projectPurchased } = req.body;
      if (!name || !content) {
        return res.status(400).json({ error: "Customer name and feedback are required." });
      }

      const newTest = await Testimonial.create({
        id: "t" + Date.now(),
        name,
        role: role || "Homeowner",
        content,
        rating: Number(rating) || 5,
        avatar: avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        projectPurchased: projectPurchased || "ERA Emerald Country Resort & Villas",
        hidden: false
      });

      res.status(201).json({ success: true, testimonial: newTest });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/testimonials/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { hidden, name, role, content, rating, avatar, projectPurchased } = req.body;

      const existing = await Testimonial.findOne({ id });
      if (!existing) {
        return res.status(404).json({ error: "Testimonial not found." });
      }

      const updateFields: any = {};
      if (hidden !== undefined) updateFields.hidden = !!hidden;
      if (name !== undefined) updateFields.name = name;
      if (role !== undefined) updateFields.role = role;
      if (content !== undefined) updateFields.content = content;
      if (rating !== undefined) updateFields.rating = Number(rating);
      if (avatar !== undefined) updateFields.avatar = avatar;
      if (projectPurchased !== undefined) updateFields.projectPurchased = projectPurchased;

      const updated = await Testimonial.findOneAndUpdate({ id }, { $set: updateFields }, { new: true });

      res.json({ success: true, testimonial: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/testimonials/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Testimonial.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ error: "Testimonial not found or already deleted." });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper to format Cloudinary context string safely
  const formatCloudinaryContextString = (title: any, category: any, projectId: any): string => {
    const cleanTitle = String(title || "Gallery Image").replace(/[|=]/g, " ");
    const cleanCategory = String(category || "site").replace(/[|=]/g, " ");
    const cleanProjectId = String(projectId || "").replace(/[|=]/g, " ");
    return `title=${cleanTitle}|category=${cleanCategory}|projectId=${cleanProjectId}`;
  };

  // Shared handlers for gallery integration using direct Cloudinary storage
  const handleGetGallery = async (req: express.Request, res: express.Response) => {
    try {
      const gallery = await GalleryItem.find().lean();
      const items = (gallery || []).map(({ _id, __v, ...rest }: any) => rest);
      res.json({ success: true, galleryItems: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  const handlePostGallery = async (req: express.Request, res: express.Response) => {
    try {
      const { title, category, image, projectId } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image source link is mandatory." });
      }

      let finalImageUrl = image;
      let publicId = getPublicIdFromUrl(image);

      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      if (cloudinaryConfigured) {
        if (image.startsWith("data:")) {
          const safeName = "gallery_" + Date.now();
          console.log(`[Cloudinary] Uploading base64 image ${safeName} directly to Cloudinary...`);
          const result = await cloudinary.uploader.upload(image, {
            folder: "era_infra",
            public_id: safeName,
            resource_type: "auto",
            context: formatCloudinaryContextString(title, category, projectId)
          });
          if (result && result.secure_url) {
            finalImageUrl = result.secure_url;
            publicId = result.public_id;
          }
        } else if (publicId) {
          console.log(`[Cloudinary] Updating metadata for public ID ${publicId} directly in Cloudinary...`);
          await cloudinary.uploader.add_context(
            formatCloudinaryContextString(title, category, projectId),
            [publicId]
          );
        }
      }

      const id = publicId || "gallery-" + Date.now();
      const newGalleryItem = await GalleryItem.create({
        id,
        title: title || "Gallery Image",
        category: category || "site",
        image: finalImageUrl,
        projectId: projectId || ""
      });

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: `New gallery image added to Layout Archive`,
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        galleryItem: newGalleryItem
      });
    } catch (err: any) {
      console.error("[Cloudinary] Gallery POST error:", err);
      res.status(500).json({ error: err.message });
    }
  };

  const handlePutGallery = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { title, category, image, projectId } = req.body;

      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      if (cloudinaryConfigured && id && !id.startsWith("gallery-bulk") && !id.startsWith("gallery-")) {
        console.log(`[Cloudinary] Updating context for resource ${id} directly in Cloudinary...`);
        await cloudinary.uploader.add_context(
          formatCloudinaryContextString(title, category, projectId),
          [id]
        );
      }

      const updatedItem = await GalleryItem.findOneAndUpdate(
        { id },
        {
          $set: {
            title: title || "Gallery Image",
            category: category || "site",
            image,
            projectId: projectId || ""
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        galleryItem: updatedItem
      });
    } catch (err: any) {
      console.error("[Cloudinary] Gallery PUT error:", err);
      res.status(500).json({ error: err.message });
    }
  };

  const handleDeleteGallery = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

      if (cloudinaryConfigured && id && !id.startsWith("gallery-bulk") && !id.startsWith("gallery-")) {
        console.log(`[Cloudinary] Destroying resource ${id} in Cloudinary...`);
        await cloudinary.uploader.destroy(id);
      }

      await GalleryItem.findOneAndDelete({ id });

      res.json({ success: true, message: "Gallery image removed successfully." });
    } catch (err: any) {
      console.error("[Cloudinary] Gallery DELETE error:", err);
      res.status(500).json({ error: err.message });
    }
  };

  // Gallery REST Endpoints (reads stay public so the live website can render the gallery;
  // writes/deletes require a valid admin session)
  app.get("/api/gallery", handleGetGallery);
  app.post("/api/gallery", requireAdminAuth, handlePostGallery);
  app.put("/api/gallery/:id", requireAdminAuth, handlePutGallery);
  app.delete("/api/gallery/:id", requireAdminAuth, handleDeleteGallery);

  // Legacy/Admin mappings
  app.get("/api/admin/gallery", requireAdminAuth, handleGetGallery);
  app.post("/api/admin/gallery", requireAdminAuth, handlePostGallery);
  app.put("/api/admin/gallery/:id", requireAdminAuth, handlePutGallery);
  app.delete("/api/admin/gallery/:id", requireAdminAuth, handleDeleteGallery);

  // SEO Configurations Update
  app.put("/api/admin/seo", requireAdminAuth, async (req, res) => {
    try {
      const { home, about, projects, contact } = req.body;
      
      const existingSeo = await SeoSettings.findOne();
      const currentSeo: any = existingSeo ? existingSeo.toObject() : {
        home: { title: "", description: "" },
        about: { title: "", description: "" },
        projects: { title: "", description: "" },
        contact: { title: "", description: "" }
      };

      if (home) currentSeo.home = { ...currentSeo.home, ...home };
      if (about) currentSeo.about = { ...currentSeo.about, ...about };
      if (projects) currentSeo.projects = { ...currentSeo.projects, ...projects };
      if (contact) currentSeo.contact = { ...currentSeo.contact, ...contact };

      delete currentSeo._id;
      delete currentSeo.__v;

      const updatedSeo = await SeoSettings.findOneAndUpdate({}, { $set: currentSeo }, { upsert: true, new: true });

      await RecentActivity.create({
        id: "act-" + Date.now(),
        text: "SEO Metatags and custom rankings saved successfully",
        type: "system",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, seoSettings: updatedSeo });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Handle Vite Asset Serving and Routing fallback in different environments
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ERA INFRA API] Server is successfully running on port ${PORT}`);
  });
}

startServer();
