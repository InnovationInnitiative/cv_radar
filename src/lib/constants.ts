
export const CITIES = [
    "Agra", "Ahmedabad", "Allahabad", "Amritsar", "Aurangabad",
    "Bangalore", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
    "Coimbatore", "Dehradun", "Delhi NCR", "Faridabad", "Ghaziabad",
    "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur",
    "Jamshedpur", "Jodhpur", "Kanpur", "Kochi", "Kolkata",
    "Lucknow", "Ludhiana", "Mangalore", "Mumbai", "Mysore",
    "Nagpur", "Nashik", "Navi Mumbai", "Noida", "Patna",
    "Pune", "Raipur", "Ranchi", "Surat", "Thiruvananthapuram",
    "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam"
];

export const MAJORS = [
    "Aerospace Engineering",
    "Agricultural Engineering",
    "Artificial Intelligence & ML",
    "Automobile Engineering",
    "Biomedical Engineering",
    "Biotechnology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science & Engineering",
    "Cyber Security",
    "Data Science",
    "Electrical & Electronics Engineering",
    "Electrical Engineering",
    "Electronics & Communication",
    "Electronics & Instrumentation",
    "Environmental Engineering",
    "Industrial Engineering",
    "Information Technology",
    "Instrumentation & Control",
    "Marine Engineering",
    "Mechanical Engineering",
    "Mechatronics",
    "Metallurgical Engineering",
    "Mining Engineering",
    "Petroleum Engineering",
    "Production Engineering",
    "Robotics Engineering",
    "Software Engineering",
    "Telecommunication Engineering",
    "Textile Engineering"
];
// Synonyms for broad search
export const MAJOR_ALIASES: Record<string, string[]> = {
    "Computer Science & Engineering": ["CSE", "CS", "Software Engineering", "Computer Science"],
    "Information Technology": ["IT", "Info Tech", "Software"],
    "Electronics & Communication": ["ECE", "Electronics", "Communication Engineering"],
    "Electrical & Electronics Engineering": ["EEE", "Electrical Engineering"],
    "Mechanical Engineering": ["Mechanical", "Mech"],
    "Civil Engineering": ["Civil", "Construction"],
    "Artificial Intelligence & ML": ["AI", "ML", "Data Science", "Artificial Intelligence"],
    "Data Science": ["Data Analyst", "Big Data", "AI"],
    "Biotechnology": ["Biotech", "Bioinformatics"]
};
