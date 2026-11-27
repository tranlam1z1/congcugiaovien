/** Hình minh họa cho từ vựng: biểu tượng nét của thư viện Lucide (giấy phép ISC). */
import {
  Apple, Armchair, Backpack, Banana, Bath, Bed, Bell, Bike, Bird, Book, Bug, Bus, Cake, Camera,
  Candy, Car, Carrot, Cat, Cherry, Citrus, Clock, Cloud, CloudRain, Cookie, Croissant, Crown,
  CupSoda, Dog, DoorOpen, Drum, Ear, Egg, Eraser, Eye, Fish, Flower2, Footprints, Gift, Glasses,
  Grape, Guitar, Hand, Heart, Hospital, House, IceCreamCone, Key, Lamp, Laptop, Leaf, Library,
  Milk, Moon, Mountain, Music, Pencil, Pen, Piano, Pizza, Plane, Rabbit, Rainbow, Rat, Rocket,
  Ruler, Sailboat, Sandwich, School, Scissors, Ship, Shirt, Smartphone, Snail, Snowflake, Sofa,
  Soup, Squirrel, Star, Store, Sun, Tractor, TrainFront, TreeDeciduous, Truck, Turtle, Tv,
  Umbrella, Volleyball, Watch, Wind, type LucideIcon,
} from 'lucide-react';

const PICTURES: Record<string, LucideIcon> = {
  apple: Apple, armchair: Armchair, bag: Backpack, backpack: Backpack, banana: Banana, bath: Bath,
  bed: Bed, bell: Bell, bike: Bike, bicycle: Bike, bird: Bird, book: Book, bug: Bug, bus: Bus,
  cake: Cake, camera: Camera, candy: Candy, car: Car, carrot: Carrot, cat: Cat, cherry: Cherry,
  lemon: Citrus, orange: Citrus, clock: Clock, cloud: Cloud, cloudy: Cloud, rain: CloudRain,
  rainy: CloudRain, cookie: Cookie, croissant: Croissant, crown: Crown, juice: CupSoda, dog: Dog,
  door: DoorOpen, drum: Drum, ear: Ear, egg: Egg, eraser: Eraser, eye: Eye, fish: Fish,
  flower: Flower2, foot: Footprints, gift: Gift, glasses: Glasses, grape: Grape, guitar: Guitar,
  hand: Hand, heart: Heart, hospital: Hospital, house: House, home: House,
  'ice cream': IceCreamCone, key: Key, lamp: Lamp, laptop: Laptop, leaf: Leaf, library: Library,
  milk: Milk, moon: Moon, mountain: Mountain, music: Music, pencil: Pencil, pen: Pen,
  piano: Piano, pizza: Pizza, plane: Plane, rabbit: Rabbit, rainbow: Rainbow, rat: Rat,
  rocket: Rocket, ruler: Ruler, boat: Sailboat, sandwich: Sandwich, school: School,
  scissors: Scissors, ship: Ship, shirt: Shirt, phone: Smartphone, snail: Snail,
  snow: Snowflake, snowy: Snowflake, sofa: Sofa, soup: Soup, squirrel: Squirrel, star: Star,
  market: Store, shop: Store, sun: Sun, sunny: Sun, tractor: Tractor, train: TrainFront,
  tree: TreeDeciduous, truck: Truck, turtle: Turtle, tv: Tv, umbrella: Umbrella,
  ball: Volleyball, watch: Watch, wind: Wind, windy: Wind,
};

/** Hình cho một dòng chỉ gồm đúng một từ (nhận cả số nhiều thêm "s", "es"). */
export function pictureFor(line: string): LucideIcon | undefined {
  const word = line.trim().toLowerCase();
  for (const key of [word, word.replace(/s$/, ''), word.replace(/es$/, '')]) {
    if (Object.hasOwn(PICTURES, key)) return PICTURES[key];
  }
  return undefined;
}
