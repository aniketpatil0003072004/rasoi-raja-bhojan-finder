
export interface Mess {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  cuisine: string[];
  address: string;
  imageUrl: string;
  monthlyPrice: number;
  weeklyMenu: { day: string; meals: { breakfast: string; lunch: string; dinner: string } }[];
  operatingHours: string;
  contact: string;
  offersDelivery: boolean;
}

export const mockMesses: Mess[] = [
  {
    id: "1",
    name: "Annapurna Mess",
    description: "Authentic North Indian home-style meals. Fresh ingredients, daily changing menu.",
    rating: 4.5,
    reviewCount: 120,
    cuisine: ["North Indian", "Vegetarian"],
    address: "123 Foodie Street, Koramangala, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60", // Placeholder image
    monthlyPrice: 3500,
    weeklyMenu: [
      { day: "Monday", meals: { breakfast: "Aloo Paratha", lunch: "Rajma Chawal", dinner: "Paneer Butter Masala, Roti" } },
      { day: "Tuesday", meals: { breakfast: "Poha", lunch: "Dal Makhani, Rice", dinner: "Mix Veg, Roti" } },
      { day: "Wednesday", meals: { breakfast: "Upma", lunch: "Chole Bhature", dinner: "Aloo Gobi, Roti" } },
      { day: "Thursday", meals: { breakfast: "Idli Sambhar", lunch: "Veg Biryani", dinner: "Palak Paneer, Roti" } },
      { day: "Friday", meals: { breakfast: "Bread Omelette", lunch: "Kadhi Pakoda, Rice", dinner: "Dal Tadka, Jeera Rice" } },
      { day: "Saturday", meals: { breakfast: "Masala Dosa", lunch: "Special Thali", dinner: "Chana Masala, Puri" } },
      { day: "Sunday", meals: { breakfast: "Puri Sabji", lunch: "Paneer Pulao", dinner: "Malai Kofta, Naan" } },
    ],
    operatingHours: "8:00 AM - 10:00 PM",
    contact: "9876543210",
    offersDelivery: true,
  },
  {
    id: "2",
    name: "South Delights Mess",
    description: "Traditional South Indian meals, prepared with love and authentic spices.",
    rating: 4.2,
    reviewCount: 95,
    cuisine: ["South Indian"],
    address: "456 Dosa Lane, Indiranagar, Bangalore",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60", // Placeholder image
    monthlyPrice: 3200,
    weeklyMenu: [
      { day: "Monday", meals: { breakfast: "Idli Vada", lunch: "Sambar Rice, Poriyal", dinner: "Lemon Rice, Kootu" } },
      { day: "Tuesday", meals: { breakfast: "Pongal", lunch: "Bisi Bele Bath", dinner: "Tomato Rice, Avial" } },
      // ... more days
    ],
    operatingHours: "7:30 AM - 9:30 PM",
    contact: "9123456780",
    offersDelivery: false,
  },
  // Add more mock messes if needed
];

