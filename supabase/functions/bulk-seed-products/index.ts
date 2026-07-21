import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, requireAdmin } from "../_shared/requireAdmin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrandDef {
  b: string; c: string; o: string; f: string; e: string; t: string;
  abv: number; p: number; v: string[]; taste: string; notes: string;
}

// ═══════════════ 500+ BRANDS ═══════════════
const B: BrandDef[] = [
  // ── WHISKY: Very Popular (Top Sellers India) ──
  {b:"Johnnie Walker Black Label",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:4200,v:["750ml","1L"],taste:"Complex & Smoky",notes:"Vanilla smoke dried fruit"},
  {b:"Johnnie Walker Red Label",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1800,v:["750ml","1L","180ml"],taste:"Bold & Spicy",notes:"Cinnamon pepper sweet"},
  {b:"Johnnie Walker Gold Label Reserve",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:5500,v:["750ml"],taste:"Creamy & Honey",notes:"Honey vanilla wood smoke"},
  {b:"Johnnie Walker Blue Label",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:18000,v:["750ml"],taste:"Velvety & Complex",notes:"Dark chocolate hazelnut smoke"},
  {b:"Johnnie Walker Double Black",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:4800,v:["750ml"],taste:"Intense & Smoky",notes:"Peat smoke spice"},
  {b:"Johnnie Walker Green Label",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended Malt",abv:43,p:5200,v:["750ml"],taste:"Fresh & Complex",notes:"Grass wood fruit"},
  {b:"Royal Stag",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:620,v:["750ml","375ml","180ml","90ml"],taste:"Smooth & Mellow",notes:"Grain vanilla malt"},
  {b:"Imperial Blue",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:560,v:["750ml","375ml","180ml","90ml"],taste:"Light & Smooth",notes:"Light grain subtle sweetness"},
  {b:"McDowell's No.1",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:520,v:["750ml","375ml","180ml"],taste:"Rich & Bold",notes:"Oak grain spice"},
  {b:"McDowell's No.1 Platinum",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:680,v:["750ml","375ml"],taste:"Refined & Smooth",notes:"Oak vanilla subtle"},
  {b:"Blenders Pride",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:780,v:["750ml","375ml","180ml"],taste:"Balanced & Smooth",notes:"Malt grain oak vanilla"},
  {b:"Blenders Pride Reserve",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:1100,v:["750ml"],taste:"Rich & Elegant",notes:"Dried fruit oak caramel"},
  {b:"Jack Daniel's Old No.7",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Tennessee",abv:40,p:3200,v:["750ml","1L","375ml"],taste:"Sweet & Oaky",notes:"Caramel vanilla oak charcoal"},
  {b:"Jack Daniel's Honey",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Flavored",abv:35,p:3400,v:["750ml"],taste:"Sweet & Honey",notes:"Honey caramel smooth"},
  {b:"Jack Daniel's Apple",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Flavored",abv:35,p:3400,v:["750ml"],taste:"Crisp & Apple",notes:"Green apple caramel crisp"},
  {b:"Jack Daniel's Fire",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Flavored",abv:35,p:3400,v:["750ml"],taste:"Spicy & Cinnamon",notes:"Cinnamon red hot sweet"},
  {b:"Jack Daniel's Single Barrel",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Single Barrel",abv:47,p:6500,v:["750ml"],taste:"Rich & Complex",notes:"Caramel oak dark fruit"},
  {b:"Jack Daniel's Gentleman Jack",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Premium",abv:40,p:4200,v:["750ml"],taste:"Ultra Smooth",notes:"Vanilla caramel maple"},
  {b:"Chivas Regal 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:3800,v:["750ml","1L"],taste:"Fruity & Creamy",notes:"Apple honey vanilla cream"},
  {b:"Chivas Regal 18",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:7500,v:["750ml"],taste:"Rich & Chocolatey",notes:"Dark chocolate dried fruit"},
  {b:"Chivas Regal 25",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Ultra Premium",abv:40,p:28000,v:["750ml"],taste:"Extraordinary & Rare",notes:"Rose petal chocolate peach"},
  {b:"Chivas Regal XV",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:5200,v:["750ml"],taste:"Smooth & Citrus",notes:"Citrus honey vanilla"},
  {b:"Black Dog",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:1400,v:["750ml","375ml","180ml"],taste:"Smooth & Rich",notes:"Malt toffee subtle smoke"},
  {b:"Black Dog Triple Gold Reserve",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:2100,v:["750ml"],taste:"Rich & Oaky",notes:"Oak vanilla caramel"},
  {b:"100 Pipers",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1600,v:["750ml","375ml","180ml"],taste:"Light & Floral",notes:"Heather honey light peat"},
  {b:"100 Pipers 12 Year",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2800,v:["750ml"],taste:"Mellow & Complex",notes:"Oak honey malt"},
  {b:"Teachers Highland Cream",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1700,v:["750ml","375ml"],taste:"Smoky & Sweet",notes:"Peat honey malt"},
  {b:"Glenfiddich 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:4200,v:["750ml"],taste:"Fresh & Fruity",notes:"Pear apple oak butterscotch"},
  {b:"Glenfiddich 15",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:6200,v:["750ml"],taste:"Rich & Complex",notes:"Sherry honey spice"},
  {b:"Glenfiddich 18",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:9500,v:["750ml"],taste:"Robust & Oaky",notes:"Oak dried fruit baked apple"},
  {b:"Glenfiddich 21",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:16000,v:["750ml"],taste:"Exotic & Complex",notes:"Rum cask fig lime toffee"},
  {b:"The Glenlivet 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:4000,v:["750ml"],taste:"Smooth & Fruity",notes:"Tropical fruit vanilla pineapple"},
  {b:"The Glenlivet 15",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:5800,v:["750ml"],taste:"Rich & Spicy",notes:"Cinnamon ginger butterscotch"},
  {b:"The Glenlivet 18",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:43,p:9000,v:["750ml"],taste:"Elegant & Floral",notes:"Orange blossom spice toffee"},
  {b:"Antiquity Blue",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:900,v:["750ml","375ml","180ml"],taste:"Balanced & Woody",notes:"Oak malt vanilla spice"},
  {b:"Signature",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:850,v:["750ml","375ml","180ml"],taste:"Smooth & Refined",notes:"Grain malt wood"},
  {b:"Signature Premier",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Super Premium",abv:42.8,p:1600,v:["750ml"],taste:"Luxurious & Complex",notes:"Rich malt oak fruit"},
  {b:"Royal Challenge",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:700,v:["750ml","375ml","180ml"],taste:"Smooth & Balanced",notes:"Malt grain subtle spice"},
  {b:"Officer's Choice",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:480,v:["750ml","375ml","180ml","90ml"],taste:"Bold & Strong",notes:"Grain oak bold"},
  {b:"Officer's Choice Blue",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:580,v:["750ml","375ml","180ml"],taste:"Smooth & Light",notes:"Grain smooth subtle"},
  {b:"Officer's Choice Black",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:650,v:["750ml","375ml"],taste:"Dark & Rich",notes:"Dark malt grain oak"},
  {b:"Ballantine's Finest",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2200,v:["750ml","1L"],taste:"Sweet & Smooth",notes:"Vanilla honey apple"},
  {b:"Ballantine's 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:3600,v:["750ml"],taste:"Smoky & Honey",notes:"Oak honey smoke"},
  {b:"Monkey Shoulder",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended Malt",abv:40,p:4500,v:["750ml"],taste:"Rich & Creamy",notes:"Vanilla berry honey butter"},
  {b:"Amrut Fusion",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:50,p:5500,v:["750ml"],taste:"Bold & Complex",notes:"Barley peat tropical fruit"},
  {b:"Amrut Indian Single Malt",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:4200,v:["750ml"],taste:"Malty & Sweet",notes:"Barley honey caramel"},
  {b:"Amrut Peated",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:6200,v:["750ml"],taste:"Smoky & Bold",notes:"Peat smoke barley"},
  {b:"Paul John Brilliance",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:4800,v:["750ml"],taste:"Smooth & Malty",notes:"Honey barley light spice"},
  {b:"Paul John Bold",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:5200,v:["750ml"],taste:"Peated & Rich",notes:"Peat spice honey"},
  {b:"Paul John Edited",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:5000,v:["750ml"],taste:"Complex & Balanced",notes:"Peat fruit honey spice"},
  {b:"Rampur Indian Single Malt",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:43,p:4500,v:["750ml"],taste:"Tropical & Spicy",notes:"Mango vanilla spice"},
  {b:"Rampur Double Cask",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:45,p:6500,v:["750ml"],taste:"Rich & Sherried",notes:"Sherry fruit oak"},
  {b:"Indri Trini",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Single Malt",abv:46,p:5800,v:["750ml"],taste:"Complex & Layered",notes:"Triple cask fruit spice oak"},
  {b:"Peter Scot",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:550,v:["750ml","375ml","180ml"],taste:"Strong & Bold",notes:"Grain oak spice"},
  {b:"Dewars White Label",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2100,v:["750ml","1L"],taste:"Smooth & Honeyed",notes:"Honey citrus vanilla"},
  {b:"Dewars 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:3500,v:["750ml"],taste:"Mellow & Rich",notes:"Honey apple oak"},
  {b:"VAT 69",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1500,v:["750ml","375ml","180ml"],taste:"Malty & Sweet",notes:"Malt toffee soft"},
  {b:"Haywards Fine",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:450,v:["750ml","375ml","180ml"],taste:"Bold & Grain",notes:"Grain strong bold"},
  {b:"8PM",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:500,v:["750ml","375ml","180ml"],taste:"Smooth & Mild",notes:"Light grain subtle"},
  {b:"8PM Premium Black",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:650,v:["750ml","375ml"],taste:"Rich & Dark",notes:"Dark grain malt"},
  {b:"Director's Special",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:480,v:["750ml","375ml","180ml"],taste:"Rich & Malty",notes:"Malt grain oak"},
  {b:"Director's Special Black",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:620,v:["750ml","375ml"],taste:"Smooth & Dark",notes:"Dark malt grain"},
  {b:"Bagpiper Gold",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:460,v:["750ml","375ml","180ml"],taste:"Mild & Smooth",notes:"Light grain smooth"},
  {b:"Oaksmith Gold",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:950,v:["750ml","375ml"],taste:"Rich & Oaky",notes:"Oak vanilla bourbon cask"},
  {b:"Oaksmith International",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Super Premium",abv:42.8,p:1800,v:["750ml"],taste:"Luxurious & Smooth",notes:"Multi-cask oak vanilla"},
  {b:"Singleton 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:4500,v:["750ml"],taste:"Smooth & Fruity",notes:"Fruit malt honey"},
  {b:"Talisker 10",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:45.8,p:5800,v:["750ml"],taste:"Smoky & Maritime",notes:"Sea salt peat smoke pepper"},
  {b:"Talisker Storm",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:45.8,p:5200,v:["750ml"],taste:"Intense & Peppery",notes:"Storm pepper sweet smoke"},
  {b:"Lagavulin 16",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:43,p:9200,v:["750ml"],taste:"Intensely Peaty",notes:"Peat smoke iodine sweetness"},
  {b:"Macallan 12 Double Cask",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:7200,v:["750ml"],taste:"Rich & Sherry",notes:"Sherry oak dried fruit honey"},
  {b:"Macallan 12 Sherry Oak",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:8500,v:["750ml"],taste:"Rich & Full",notes:"Dried fruit ginger sherry"},
  {b:"Macallan 18",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:43,p:32000,v:["750ml"],taste:"Exquisite & Complex",notes:"Dried fruit chocolate orange"},
  {b:"Highland Park 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:5500,v:["750ml"],taste:"Smoky & Honey",notes:"Heather honey peat smoke"},
  {b:"Jameson Irish",c:"whisky",o:"Ireland",f:"🇮🇪",e:"🥃",t:"Irish Whiskey",abv:40,p:2800,v:["750ml","1L"],taste:"Smooth & Triple Distilled",notes:"Vanilla cream toasted wood"},
  {b:"Jameson Black Barrel",c:"whisky",o:"Ireland",f:"🇮🇪",e:"🥃",t:"Premium Irish",abv:40,p:3800,v:["750ml"],taste:"Rich & Smooth",notes:"Butterscotch toffee spice"},
  {b:"Jameson Caskmates Stout",c:"whisky",o:"Ireland",f:"🇮🇪",e:"🥃",t:"Irish Whiskey",abv:40,p:3200,v:["750ml"],taste:"Cocoa & Coffee",notes:"Cocoa coffee hops butterscotch"},
  {b:"Jim Beam White",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:40,p:2200,v:["750ml","1L"],taste:"Sweet & Vanilla",notes:"Vanilla caramel corn"},
  {b:"Jim Beam Black",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:43,p:3200,v:["750ml"],taste:"Rich & Oaky",notes:"Caramel oak toffee"},
  {b:"Jim Beam Honey",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Flavored",abv:35,p:2400,v:["750ml"],taste:"Sweet & Honey",notes:"Honey caramel smooth"},
  {b:"Maker's Mark",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:45,p:4200,v:["750ml"],taste:"Sweet & Wheaty",notes:"Caramel vanilla wheat red winter"},
  {b:"Wild Turkey 101",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:50.5,p:3800,v:["750ml"],taste:"Bold & Spicy",notes:"Vanilla toffee tobacco oak"},
  {b:"Woodford Reserve",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:43.2,p:5200,v:["750ml"],taste:"Rich & Balanced",notes:"Dried fruit vanilla caramel tobacco"},
  {b:"Buffalo Trace",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:45,p:3800,v:["750ml"],taste:"Sweet & Complex",notes:"Brown sugar vanilla anise toffee"},
  {b:"Bulleit Bourbon",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:45,p:3500,v:["750ml"],taste:"Spicy & Oaky",notes:"Rye spice cherry oak"},
  {b:"Four Roses",c:"whisky",o:"USA",f:"🇺🇸",e:"🥃",t:"Bourbon",abv:40,p:2800,v:["750ml"],taste:"Mellow & Floral",notes:"Fruit floral caramel"},
  {b:"Nikka From The Barrel",c:"whisky",o:"Japan",f:"🇯🇵",e:"🥃",t:"Japanese Blended",abv:51.4,p:6500,v:["500ml"],taste:"Intense & Rich",notes:"Fruit malt peat vanilla"},
  {b:"Hibiki Harmony",c:"whisky",o:"Japan",f:"🇯🇵",e:"🥃",t:"Japanese Blended",abv:43,p:8500,v:["750ml"],taste:"Elegant & Harmonious",notes:"Orange peel honey light oak"},
  {b:"Yamazaki 12",c:"whisky",o:"Japan",f:"🇯🇵",e:"🥃",t:"Japanese Single Malt",abv:43,p:12000,v:["750ml"],taste:"Complex & Fruity",notes:"Peach vanilla Mizunara oak"},
  {b:"Suntory Toki",c:"whisky",o:"Japan",f:"🇯🇵",e:"🥃",t:"Japanese Blended",abv:43,p:3800,v:["750ml"],taste:"Subtle & Silky",notes:"Green apple honey ginger"},
  {b:"Aberlour 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:5200,v:["750ml"],taste:"Rich & Sherried",notes:"Sherry spice chocolate"},
  {b:"Dalmore 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:6800,v:["750ml"],taste:"Rich & Orange",notes:"Orange marmalade chocolate spice"},
  {b:"Oban 14",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:43,p:7200,v:["750ml"],taste:"Balanced & Maritime",notes:"Sea salt honey citrus"},
  {b:"Glenmorangie 10",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:4500,v:["750ml"],taste:"Delicate & Fruity",notes:"Peach orange almond vanilla"},
  {b:"Laphroaig 10",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:6200,v:["750ml"],taste:"Heavily Peated",notes:"Seaweed peat smoke iodine"},
  {b:"Ardbeg 10",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:46,p:7000,v:["750ml"],taste:"Smoky & Complex",notes:"Peat lemon chocolate espresso"},
  {b:"Bowmore 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:5500,v:["750ml"],taste:"Balanced & Smoky",notes:"Lemon honey warm peat"},
  {b:"Cragganmore 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:5200,v:["750ml"],taste:"Complex & Malty",notes:"Malt smoke herbs green fruit"},
  {b:"Cardhu 12",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Single Malt",abv:40,p:4800,v:["750ml"],taste:"Sweet & Malty",notes:"Pear malt honey apple"},
  {b:"Royal Salute 21",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Ultra Premium",abv:40,p:14000,v:["750ml"],taste:"Regal & Smoky",notes:"Smoke fruit floral peaty"},
  {b:"Cutty Sark",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1800,v:["750ml"],taste:"Light & Fresh",notes:"Citrus vanilla light malt"},
  {b:"Famous Grouse",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2000,v:["750ml"],taste:"Balanced & Smooth",notes:"Oak sherry fruit cream"},
  {b:"Grant's Triple Wood",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1900,v:["750ml","1L"],taste:"Rich & Complex",notes:"Vanilla toffee smoke fruit"},
  {b:"White & Mackay",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1700,v:["750ml"],taste:"Sweet & Oaky",notes:"Toffee oak fruit honey"},
  {b:"Black & White",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1600,v:["750ml","375ml"],taste:"Light & Smooth",notes:"Grain malt gentle"},
  {b:"William Lawson's",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1500,v:["750ml","1L"],taste:"Mellow & Sweet",notes:"Grain malt subtle fruit"},
  {b:"Label 5",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1400,v:["750ml"],taste:"Smooth & Malty",notes:"Malt grain caramel"},
  {b:"Passport Scotch",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1300,v:["750ml","375ml"],taste:"Light & Clean",notes:"Grain light clean"},
  {b:"Something Special",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2400,v:["750ml"],taste:"Mellow & Sweet",notes:"Honey vanilla oak"},
  {b:"Clan MacGregor",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1200,v:["750ml","1L"],taste:"Smooth & Clean",notes:"Light grain clean"},
  {b:"Bell's Original",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1500,v:["750ml","1L"],taste:"Smooth & Nutty",notes:"Nut grain malt"},
  {b:"J&B Rare",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:2000,v:["750ml"],taste:"Light & Herbal",notes:"Herb nut grain"},
  {b:"Old Smuggler",c:"whisky",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🥃",t:"Blended",abv:40,p:1100,v:["750ml"],taste:"Mild & Gentle",notes:"Grain malt subtle"},
  {b:"McDowells Soda",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:400,v:["750ml","375ml","180ml","90ml"],taste:"Light & Mild",notes:"Grain light mild"},
  {b:"All Seasons",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:420,v:["750ml","375ml","180ml"],taste:"Smooth & Mild",notes:"Grain light smooth"},
  {b:"Sterling Reserve B7",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:750,v:["750ml","375ml","180ml"],taste:"Smooth & Rich",notes:"Grain malt bourbon cask"},
  {b:"Sterling Reserve B10",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Super Premium",abv:42.8,p:1200,v:["750ml"],taste:"Rich & Complex",notes:"Malt bourbon oak"},
  {b:"Rockford Reserve",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Premium",abv:42.8,p:850,v:["750ml","375ml"],taste:"Robust & Malty",notes:"Malt oak roast"},
  {b:"1965 Spirit of Victory",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:380,v:["750ml","375ml","180ml"],taste:"Bold & Classic",notes:"Grain malt classic"},
  {b:"Royal Green",c:"whisky",o:"India",f:"🇮🇳",e:"🥃",t:"Blended",abv:42.8,p:350,v:["750ml","375ml","180ml"],taste:"Light & Basic",notes:"Grain light basic"},

  // ── RUM: Very Popular to Less Popular ──
  {b:"Old Monk",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:490,v:["750ml","375ml","180ml"],taste:"Rich & Sweet",notes:"Caramel vanilla chocolate"},
  {b:"Old Monk Supreme",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Premium Dark Rum",abv:42.8,p:650,v:["750ml"],taste:"Rich & Complex",notes:"Caramel oak vanilla spice"},
  {b:"Old Monk Gold Reserve",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Premium",abv:42.8,p:800,v:["750ml"],taste:"Luxurious & Smooth",notes:"Oak vanilla honey aged"},
  {b:"Bacardi White",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"White Rum",abv:40,p:1200,v:["750ml","1L","375ml"],taste:"Light & Clean",notes:"Light citrus vanilla"},
  {b:"Bacardi Gold",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"Gold Rum",abv:40,p:1350,v:["750ml"],taste:"Smooth & Caramel",notes:"Oaky butterscotch vanilla"},
  {b:"Bacardi Limon",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"Flavored Rum",abv:35,p:1300,v:["750ml"],taste:"Citrus & Fresh",notes:"Lemon lime citrus"},
  {b:"Bacardi Black",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"Dark Rum",abv:40,p:1400,v:["750ml"],taste:"Bold & Smoky",notes:"Molasses oak smoke"},
  {b:"Bacardi Coconut",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"Flavored Rum",abv:35,p:1350,v:["750ml"],taste:"Tropical & Sweet",notes:"Coconut vanilla tropical"},
  {b:"Captain Morgan Original Spiced",c:"rum",o:"Jamaica",f:"🇯🇲",e:"🍹",t:"Spiced Rum",abv:35,p:1500,v:["750ml","1L"],taste:"Sweet & Spiced",notes:"Vanilla cinnamon nutmeg"},
  {b:"Captain Morgan Black Spiced",c:"rum",o:"Jamaica",f:"🇯🇲",e:"🍹",t:"Dark Spiced",abv:40,p:1700,v:["750ml"],taste:"Dark & Spicy",notes:"Dark spice caramel clove"},
  {b:"McDowell's No.1 Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:480,v:["750ml","375ml","180ml"],taste:"Bold & Sweet",notes:"Molasses caramel spice"},
  {b:"McDowell's No.1 Celebration Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"White Rum",abv:42.8,p:520,v:["750ml","375ml"],taste:"Light & Party",notes:"Light citrus clean"},
  {b:"Havana Club 3",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"White Rum",abv:40,p:2200,v:["750ml"],taste:"Fresh & Sugarcane",notes:"Sugarcane citrus vanilla"},
  {b:"Havana Club 7",c:"rum",o:"Cuba",f:"🇨🇺",e:"🍹",t:"Aged Rum",abv:40,p:3800,v:["750ml"],taste:"Complex & Aged",notes:"Tobacco vanilla tropical fruit"},
  {b:"Malibu Coconut",c:"rum",o:"Caribbean",f:"🏝️",e:"🍹",t:"Coconut Rum",abv:21,p:1800,v:["750ml"],taste:"Sweet & Tropical",notes:"Coconut tropical sweet"},
  {b:"Contessa",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:420,v:["750ml","375ml","180ml"],taste:"Strong & Sweet",notes:"Molasses bold warm"},
  {b:"Hercules Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:400,v:["750ml","375ml","180ml"],taste:"Bold & Dark",notes:"Molasses caramel rich"},
  {b:"Old Port Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:380,v:["750ml","375ml"],taste:"Rich & Warm",notes:"Caramel molasses warm"},
  {b:"Jolly Roger",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:350,v:["750ml","375ml"],taste:"Bold & Classic",notes:"Dark bold molasses"},
  {b:"Diplomatico Reserva Exclusiva",c:"rum",o:"Venezuela",f:"🇻🇪",e:"🍹",t:"Aged Rum",abv:40,p:5500,v:["750ml"],taste:"Rich & Complex",notes:"Toffee orange chocolate"},
  {b:"Mount Gay Eclipse",c:"rum",o:"Barbados",f:"🇧🇧",e:"🍹",t:"Gold Rum",abv:40,p:2800,v:["750ml"],taste:"Smooth & Tropical",notes:"Banana vanilla apricot"},
  {b:"Appleton Estate Signature",c:"rum",o:"Jamaica",f:"🇯🇲",e:"🍹",t:"Gold Rum",abv:40,p:2500,v:["750ml"],taste:"Fruity & Spicy",notes:"Orange peel cinnamon honey"},
  {b:"Kraken Black Spiced",c:"rum",o:"Trinidad",f:"🇹🇹",e:"🍹",t:"Spiced Rum",abv:40,p:3200,v:["750ml"],taste:"Dark & Spiced",notes:"Clove ginger cinnamon coffee"},
  {b:"Plantation Barbados 5",c:"rum",o:"Barbados",f:"🇧🇧",e:"🍹",t:"Aged Rum",abv:40,p:4200,v:["750ml"],taste:"Rich & Exotic",notes:"Coconut banana vanilla cognac"},
  {b:"Sailor Jerry Spiced",c:"rum",o:"USA",f:"🇺🇸",e:"🍹",t:"Spiced Rum",abv:46,p:2200,v:["750ml"],taste:"Bold & Vanilla",notes:"Vanilla cinnamon clove"},
  {b:"Campa Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"White Rum",abv:42.8,p:350,v:["750ml","375ml","180ml"],taste:"Clean & Simple",notes:"Sugarcane simple clean"},
  {b:"DSP Black Rum",c:"rum",o:"India",f:"🇮🇳",e:"🍹",t:"Dark Rum",abv:42.8,p:320,v:["750ml","375ml","180ml"],taste:"Dark & Bold",notes:"Molasses dark strong"},

  // ── VODKA ──
  {b:"Absolut Original",c:"vodka",o:"Sweden",f:"🇸🇪",e:"🍸",t:"Premium Vodka",abv:40,p:2200,v:["750ml","1L","375ml"],taste:"Clean & Smooth",notes:"Grain pure winter wheat"},
  {b:"Absolut Citron",c:"vodka",o:"Sweden",f:"🇸🇪",e:"🍸",t:"Flavored",abv:40,p:2300,v:["750ml"],taste:"Citrus & Fresh",notes:"Lemon lime citrus"},
  {b:"Absolut Raspberry",c:"vodka",o:"Sweden",f:"🇸🇪",e:"🍸",t:"Flavored",abv:40,p:2300,v:["750ml"],taste:"Berry & Sweet",notes:"Raspberry sweet berry"},
  {b:"Absolut Vanilia",c:"vodka",o:"Sweden",f:"🇸🇪",e:"🍸",t:"Flavored",abv:40,p:2300,v:["750ml"],taste:"Vanilla & Rich",notes:"Vanilla caramel toffee"},
  {b:"Absolut Mango",c:"vodka",o:"Sweden",f:"🇸🇪",e:"🍸",t:"Flavored",abv:40,p:2300,v:["750ml"],taste:"Tropical & Fruity",notes:"Mango tropical sweet"},
  {b:"Smirnoff No.21",c:"vodka",o:"Russia",f:"🇷🇺",e:"🍸",t:"Classic Vodka",abv:40,p:1100,v:["750ml","1L","375ml","180ml"],taste:"Clean & Versatile",notes:"Pure smooth grain"},
  {b:"Smirnoff Green Apple",c:"vodka",o:"Russia",f:"🇷🇺",e:"🍸",t:"Flavored",abv:37.5,p:1200,v:["750ml"],taste:"Sweet & Fruity",notes:"Green apple sweet tart"},
  {b:"Smirnoff Orange",c:"vodka",o:"Russia",f:"🇷🇺",e:"🍸",t:"Flavored",abv:37.5,p:1200,v:["750ml"],taste:"Citrus & Juicy",notes:"Orange citrus juicy"},
  {b:"Grey Goose",c:"vodka",o:"France",f:"🇫🇷",e:"🍸",t:"Super Premium",abv:40,p:5800,v:["750ml","1L"],taste:"Silky & Refined",notes:"Almond anise citrus"},
  {b:"Grey Goose La Poire",c:"vodka",o:"France",f:"🇫🇷",e:"🍸",t:"Flavored Premium",abv:40,p:6200,v:["750ml"],taste:"Pear & Elegant",notes:"Anjou pear fresh subtle"},
  {b:"Belvedere",c:"vodka",o:"Poland",f:"🇵🇱",e:"🍸",t:"Super Premium",abv:40,p:5200,v:["750ml"],taste:"Creamy & Vanilla",notes:"Vanilla cream white pepper"},
  {b:"Ketel One",c:"vodka",o:"Netherlands",f:"🇳🇱",e:"🍸",t:"Premium",abv:40,p:3800,v:["750ml"],taste:"Crisp & Clean",notes:"Citrus honey wheat"},
  {b:"Magic Moments",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Vodka",abv:37.5,p:680,v:["750ml","375ml","180ml"],taste:"Smooth & Clean",notes:"Grain smooth light"},
  {b:"Magic Moments Remix Orange",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Flavored",abv:37.5,p:720,v:["750ml","375ml"],taste:"Orange & Fun",notes:"Orange citrus party"},
  {b:"Magic Moments Remix Green Apple",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Flavored",abv:37.5,p:720,v:["750ml","375ml"],taste:"Apple & Fresh",notes:"Green apple crisp fresh"},
  {b:"Magic Moments Remix Lemon Grass",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Flavored",abv:37.5,p:720,v:["750ml","375ml"],taste:"Herbal & Fresh",notes:"Lemongrass herbal fresh"},
  {b:"Romanov",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Vodka",abv:37.5,p:520,v:["750ml","375ml","180ml"],taste:"Clean & Light",notes:"Neutral grain clean"},
  {b:"White Mischief",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Vodka",abv:42.8,p:500,v:["750ml","375ml","180ml"],taste:"Bold & Clean",notes:"Grain neutral bold"},
  {b:"White Mischief Ultra Pure",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Premium Vodka",abv:37.5,p:650,v:["750ml"],taste:"Ultra Clean",notes:"Triple distilled pure"},
  {b:"Ciroc",c:"vodka",o:"France",f:"🇫🇷",e:"🍸",t:"Ultra Premium",abv:40,p:4800,v:["750ml"],taste:"Smooth & Grape",notes:"Grape citrus smooth"},
  {b:"Ciroc Apple",c:"vodka",o:"France",f:"🇫🇷",e:"🍸",t:"Flavored Premium",abv:35,p:5000,v:["750ml"],taste:"Apple & Crisp",notes:"Apple grape crisp"},
  {b:"Stolichnaya",c:"vodka",o:"Russia",f:"🇷🇺",e:"🍸",t:"Premium",abv:40,p:2800,v:["750ml"],taste:"Bold & Wheat",notes:"Wheat mineral bold"},
  {b:"Finlandia Classic",c:"vodka",o:"Finland",f:"🇫🇮",e:"🍸",t:"Premium",abv:40,p:2500,v:["750ml"],taste:"Clean & Crisp",notes:"Glacial barley pristine"},
  {b:"Skyy Vodka",c:"vodka",o:"USA",f:"🇺🇸",e:"🍸",t:"Premium",abv:40,p:2200,v:["750ml"],taste:"Smooth & Clean",notes:"Grain smooth American"},
  {b:"Eristoff",c:"vodka",o:"Georgia",f:"🇬🇪",e:"🍸",t:"Vodka",abv:37.5,p:1200,v:["750ml"],taste:"Pure & Smooth",notes:"Triple distilled pure"},
  {b:"Fuel Vodka",c:"vodka",o:"India",f:"🇮🇳",e:"🍸",t:"Vodka",abv:37.5,p:450,v:["750ml","375ml","180ml"],taste:"Bold & Party",notes:"Grain neutral party"},

  // ── BEER ──
  {b:"Kingfisher Premium",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:4.8,p:180,v:["650ml","500ml","330ml"],taste:"Crisp & Refreshing",notes:"Light malt hops crisp"},
  {b:"Kingfisher Ultra",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Premium Lager",abv:5,p:220,v:["650ml","500ml","330ml"],taste:"Smooth & Premium",notes:"Smooth malt refined"},
  {b:"Kingfisher Strong",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:8,p:160,v:["650ml","500ml","330ml"],taste:"Bold & Strong",notes:"Malt strong grain"},
  {b:"Kingfisher Ultra Witbier",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Wheat Beer",abv:4.8,p:240,v:["330ml"],taste:"Citrusy & Light",notes:"Orange peel wheat coriander"},
  {b:"Tuborg Strong",c:"beer",o:"Denmark",f:"🇩🇰",e:"🍺",t:"Strong Beer",abv:8,p:170,v:["650ml","500ml","330ml"],taste:"Strong & Malty",notes:"Malt bold grain"},
  {b:"Tuborg Green",c:"beer",o:"Denmark",f:"🇩🇰",e:"🍺",t:"Lager",abv:4.8,p:150,v:["650ml","500ml","330ml"],taste:"Light & Refreshing",notes:"Light crisp hops"},
  {b:"Budweiser",c:"beer",o:"USA",f:"🇺🇸",e:"🍺",t:"Lager",abv:5,p:200,v:["650ml","500ml","330ml"],taste:"Crisp & Clean",notes:"Rice malt smooth"},
  {b:"Budweiser Magnum",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:6.5,p:190,v:["650ml","500ml"],taste:"Bold & Smooth",notes:"Malt bold grain"},
  {b:"Heineken",c:"beer",o:"Netherlands",f:"🇳🇱",e:"🍺",t:"Premium Lager",abv:5,p:250,v:["650ml","500ml","330ml"],taste:"Balanced & Hoppy",notes:"Floral hops barley"},
  {b:"Carlsberg",c:"beer",o:"Denmark",f:"🇩🇰",e:"🍺",t:"Lager",abv:5,p:180,v:["650ml","500ml","330ml"],taste:"Clean & Balanced",notes:"Malt hops balanced"},
  {b:"Carlsberg Elephant",c:"beer",o:"Denmark",f:"🇩🇰",e:"🍺",t:"Strong Beer",abv:7.2,p:200,v:["650ml","500ml"],taste:"Strong & Full",notes:"Rich malt strong hops"},
  {b:"Bira 91 White",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Wheat Beer",abv:4.7,p:220,v:["330ml"],taste:"Citrusy & Light",notes:"Orange peel coriander wheat"},
  {b:"Bira 91 Blonde",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:4.5,p:200,v:["330ml"],taste:"Light & Crisp",notes:"Light malt sessionable"},
  {b:"Bira 91 IPA",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"IPA",abv:6.5,p:240,v:["330ml"],taste:"Hoppy & Bitter",notes:"Cascade hops citrus pine"},
  {b:"Bira 91 Strong",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Wheat",abv:7,p:230,v:["330ml"],taste:"Strong & Citrusy",notes:"Wheat citrus strong malt"},
  {b:"Bira 91 Boom",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:4.5,p:120,v:["330ml"],taste:"Light & Affordable",notes:"Light malt affordable"},
  {b:"Corona Extra",c:"beer",o:"Mexico",f:"🇲🇽",e:"🍺",t:"Lager",abv:4.5,p:280,v:["355ml","330ml"],taste:"Light & Citrus",notes:"Light lime corn malt"},
  {b:"Hoegaarden",c:"beer",o:"Belgium",f:"🇧🇪",e:"🍺",t:"Wheat Beer",abv:4.9,p:280,v:["330ml"],taste:"Spicy & Citrus",notes:"Coriander orange peel wheat"},
  {b:"Simba Wit",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Wheat Beer",abv:5,p:240,v:["330ml"],taste:"Smooth & Wheaty",notes:"Wheat citrus smooth"},
  {b:"Simba Stout",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Stout",abv:5.5,p:260,v:["330ml"],taste:"Dark & Roasted",notes:"Coffee chocolate roast"},
  {b:"Simba Lager",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:4.8,p:220,v:["330ml"],taste:"Crisp & Clean",notes:"Malt hops clean"},
  {b:"Godfather Strong",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:7.5,p:150,v:["650ml","500ml","330ml"],taste:"Bold & Malty",notes:"Malt strong grain"},
  {b:"Godfather Lager",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:4.8,p:130,v:["650ml","500ml"],taste:"Light & Clean",notes:"Malt light clean"},
  {b:"Kalyani Black Label",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:7.8,p:140,v:["650ml","500ml"],taste:"Strong & Dark",notes:"Strong malt bold"},
  {b:"Haywards 5000",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:7,p:145,v:["650ml","500ml","330ml"],taste:"Strong & Bold",notes:"Strong malt grain"},
  {b:"Foster's Lager",c:"beer",o:"Australia",f:"🇦🇺",e:"🍺",t:"Lager",abv:4.9,p:190,v:["650ml","500ml","330ml"],taste:"Crisp & Clean",notes:"Malt hops crisp"},
  {b:"Stella Artois",c:"beer",o:"Belgium",f:"🇧🇪",e:"🍺",t:"Pilsner",abv:5.2,p:280,v:["330ml"],taste:"Crisp & Bitter",notes:"Saaz hops malt crisp"},
  {b:"Asahi Super Dry",c:"beer",o:"Japan",f:"🇯🇵",e:"🍺",t:"Lager",abv:5,p:300,v:["330ml"],taste:"Dry & Clean",notes:"Dry crisp clean finish"},
  {b:"Miller High Life",c:"beer",o:"USA",f:"🇺🇸",e:"🍺",t:"Lager",abv:4.6,p:220,v:["330ml"],taste:"Light & Crisp",notes:"Corn malt light hops"},
  {b:"Peroni Nastro Azzurro",c:"beer",o:"Italy",f:"🇮🇹",e:"🍺",t:"Lager",abv:5.1,p:300,v:["330ml"],taste:"Crisp & Italian",notes:"Malt corn light bitter"},
  {b:"Guinness Draught",c:"beer",o:"Ireland",f:"🇮🇪",e:"🍺",t:"Stout",abv:4.2,p:350,v:["440ml","330ml"],taste:"Creamy & Roasted",notes:"Roasted barley coffee cream"},
  {b:"Leffe Blonde",c:"beer",o:"Belgium",f:"🇧🇪",e:"🍺",t:"Abbey Ale",abv:6.6,p:350,v:["330ml"],taste:"Fruity & Spicy",notes:"Clove banana vanilla"},
  {b:"Erdinger Weissbier",c:"beer",o:"Germany",f:"🇩🇪",e:"🍺",t:"Wheat Beer",abv:5.3,p:380,v:["500ml","330ml"],taste:"Banana & Clove",notes:"Banana clove wheat yeast"},
  {b:"Paulaner Hefe-Weissbier",c:"beer",o:"Germany",f:"🇩🇪",e:"🍺",t:"Wheat Beer",abv:5.5,p:400,v:["500ml","330ml"],taste:"Fruity & Yeasty",notes:"Banana apple wheat clove"},
  {b:"Schneider Weisse",c:"beer",o:"Germany",f:"🇩🇪",e:"🍺",t:"Wheat Beer",abv:5.4,p:420,v:["500ml"],taste:"Complex & Fruity",notes:"Banana clove nutmeg caramel"},
  {b:"Pilsner Urquell",c:"beer",o:"Czech Republic",f:"🇨🇿",e:"🍺",t:"Pilsner",abv:4.4,p:320,v:["330ml"],taste:"Hoppy & Crisp",notes:"Saaz hops malt bread"},
  {b:"Chimay Blue",c:"beer",o:"Belgium",f:"🇧🇪",e:"🍺",t:"Trappist Ale",abv:9,p:600,v:["330ml"],taste:"Complex & Dark",notes:"Fig caramel pepper dark fruit"},
  {b:"Delirium Tremens",c:"beer",o:"Belgium",f:"🇧🇪",e:"🍺",t:"Strong Pale Ale",abv:8.5,p:580,v:["330ml"],taste:"Fruity & Spicy",notes:"Banana orange spice honey"},
  {b:"Medha Strong",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:7.5,p:120,v:["650ml","500ml"],taste:"Value & Strong",notes:"Malt grain strong affordable"},
  {b:"Knock Out",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:8,p:130,v:["650ml","500ml"],taste:"Very Strong",notes:"Strong malt bold kick"},
  {b:"Thunderbolt",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:8,p:110,v:["650ml","500ml"],taste:"Budget Strong",notes:"Strong grain basic"},
  {b:"Royal Challenge Premium Lager",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Lager",abv:5,p:170,v:["650ml","500ml"],taste:"Smooth & Crisp",notes:"Malt hops smooth"},
  {b:"Zingaro",c:"beer",o:"India",f:"🇮🇳",e:"🍺",t:"Strong Beer",abv:6,p:100,v:["650ml"],taste:"Budget Friendly",notes:"Grain malt basic"},

  // ── GIN ──
  {b:"Bombay Sapphire",c:"gin",o:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",e:"🍸",t:"London Dry",abv:47,p:2800,v:["750ml","1L"],taste:"Floral & Citrus",notes:"Juniper lemon coriander"},
  {b:"Tanqueray London Dry",c:"gin",o:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",e:"🍸",t:"London Dry",abv:47.3,p:2500,v:["750ml","1L"],taste:"Crisp & Juniper",notes:"Juniper citrus angelica"},
  {b:"Tanqueray No. Ten",c:"gin",o:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",e:"🍸",t:"Premium",abv:47.3,p:4200,v:["750ml"],taste:"Citrus & Smooth",notes:"Grapefruit chamomile citrus"},
  {b:"Hendrick's",c:"gin",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🍸",t:"Premium Gin",abv:41.4,p:4500,v:["750ml"],taste:"Floral & Cucumber",notes:"Rose cucumber juniper"},
  {b:"Hendrick's Orbium",c:"gin",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🍸",t:"Limited",abv:43.4,p:5200,v:["750ml"],taste:"Complex & Botanical",notes:"Quinine wormwood lotus"},
  {b:"Greater Than",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"London Dry",abv:42.8,p:1600,v:["750ml"],taste:"Citrus & Botanical",notes:"Juniper fennel coriander"},
  {b:"Stranger & Sons",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Craft Gin",abv:42.8,p:2800,v:["750ml"],taste:"Tropical & Spicy",notes:"Black pepper gondhoraj citrus"},
  {b:"Jaisalmer Indian Craft Gin",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Craft Gin",abv:43,p:3200,v:["750ml"],taste:"Herbal & Complex",notes:"Vetiver coriander lemongrass"},
  {b:"Gordon's London Dry",c:"gin",o:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",e:"🍸",t:"London Dry",abv:37.5,p:1400,v:["750ml","1L"],taste:"Classic & Juniper",notes:"Juniper citrus classic"},
  {b:"Beefeater",c:"gin",o:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",e:"🍸",t:"London Dry",abv:40,p:2200,v:["750ml"],taste:"Bold & Citrus",notes:"Juniper citrus angelica"},
  {b:"Hapusa Himalayan Dry",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Craft Gin",abv:43,p:2600,v:["750ml"],taste:"Pine & Floral",notes:"Himalayan juniper turmeric"},
  {b:"Terai Indian Dry Gin",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Craft Gin",abv:43,p:2200,v:["750ml"],taste:"Spicy & Earthy",notes:"Star anise black tea spice"},
  {b:"Gin & Gin",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Indian Gin",abv:42.8,p:1100,v:["750ml"],taste:"Herbaceous & Fresh",notes:"Botanical citrus herbal"},
  {b:"Blue Riband",c:"gin",o:"India",f:"🇮🇳",e:"🍸",t:"Gin",abv:42.8,p:700,v:["750ml","375ml","180ml"],taste:"Classic & Dry",notes:"Juniper grain dry"},
  {b:"Roku Japanese Gin",c:"gin",o:"Japan",f:"🇯🇵",e:"🍸",t:"Japanese Gin",abv:43,p:3800,v:["750ml"],taste:"Floral & Delicate",notes:"Sakura cherry blossom yuzu"},
  {b:"The Botanist",c:"gin",o:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",e:"🍸",t:"Islay Gin",abv:46,p:4800,v:["750ml"],taste:"Complex & Floral",notes:"22 botanicals islay herbal"},
  {b:"Monkey 47",c:"gin",o:"Germany",f:"🇩🇪",e:"🍸",t:"Schwarzwald Gin",abv:47,p:5800,v:["500ml"],taste:"Complex & Peppery",notes:"47 botanicals cranberry pepper"},
  {b:"Aviation American Gin",c:"gin",o:"USA",f:"🇺🇸",e:"🍸",t:"American Gin",abv:42,p:3500,v:["750ml"],taste:"Floral & Smooth",notes:"Lavender cardamom sarsaparilla"},

  // ── WINE ──
  {b:"Sula Sauvignon Blanc",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"White Wine",abv:12.5,p:750,v:["750ml"],taste:"Crisp & Citrus",notes:"Grapefruit lime gooseberry"},
  {b:"Sula Shiraz",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Red Wine",abv:13.5,p:780,v:["750ml"],taste:"Bold & Peppery",notes:"Blackberry pepper plum"},
  {b:"Sula Rasa Shiraz",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Reserve Red",abv:14,p:1200,v:["750ml"],taste:"Rich & Complex",notes:"Dark fruit oak vanilla"},
  {b:"Sula Brut",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Sparkling",abv:12,p:900,v:["750ml"],taste:"Crisp & Bubbly",notes:"Apple citrus bubbles"},
  {b:"Sula Chenin Blanc",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"White Wine",abv:12,p:700,v:["750ml"],taste:"Fresh & Tropical",notes:"Melon pear guava"},
  {b:"Sula Zinfandel Rosé",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Rosé",abv:12,p:720,v:["750ml"],taste:"Light & Berry",notes:"Strawberry watermelon fresh"},
  {b:"Sula Dindori Reserve Shiraz",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Reserve Red",abv:14,p:1600,v:["750ml"],taste:"Premium & Oaky",notes:"Oak berry spice vanilla"},
  {b:"York Arros",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Red Wine",abv:13,p:700,v:["750ml"],taste:"Smooth & Fruity",notes:"Berries plum smooth"},
  {b:"Fratelli SETTE",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Red Wine",abv:14,p:1500,v:["750ml"],taste:"Bold & Tannic",notes:"Cabernet oak dark fruit"},
  {b:"Fratelli Sette Rosé",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Rosé",abv:12,p:800,v:["750ml"],taste:"Delicate & Fresh",notes:"Peach strawberry citrus"},
  {b:"Grover Zampa La Reserve",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Reserve Red",abv:13.5,p:1800,v:["750ml"],taste:"Elegant & Complex",notes:"Cabernet shiraz oak vanilla"},
  {b:"Grover Zampa Art Collection",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Red Wine",abv:13,p:900,v:["750ml"],taste:"Fruity & Balanced",notes:"Berry plum balanced"},
  {b:"Jacob's Creek Shiraz",c:"wine",o:"Australia",f:"🇦🇺",e:"🍷",t:"Red Wine",abv:13.5,p:1200,v:["750ml"],taste:"Rich & Fruity",notes:"Plum spice chocolate"},
  {b:"Jacob's Creek Chardonnay",c:"wine",o:"Australia",f:"🇦🇺",e:"🍷",t:"White Wine",abv:12.5,p:1100,v:["750ml"],taste:"Creamy & Tropical",notes:"Peach melon oak butter"},
  {b:"Barefoot Moscato",c:"wine",o:"USA",f:"🇺🇸",e:"🍷",t:"Sweet White",abv:9,p:1100,v:["750ml"],taste:"Sweet & Fruity",notes:"Peach apricot sweet"},
  {b:"Yellow Tail Shiraz",c:"wine",o:"Australia",f:"🇦🇺",e:"🍷",t:"Red Wine",abv:13.5,p:1300,v:["750ml"],taste:"Smooth & Berry",notes:"Blackberry vanilla spice"},
  {b:"Big Banyan Merlot",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Red Wine",abv:13,p:650,v:["750ml"],taste:"Soft & Plummy",notes:"Plum cherry soft tannins"},
  {b:"Big Banyan Sauvignon Blanc",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"White Wine",abv:12,p:620,v:["750ml"],taste:"Fresh & Herbal",notes:"Citrus herbs gooseberry"},
  {b:"Chandon Brut",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Sparkling",abv:12,p:1500,v:["750ml"],taste:"Elegant & Bubbly",notes:"Apple pear citrus toast"},
  {b:"Chandon Rosé",c:"wine",o:"India",f:"🇮🇳",e:"🍷",t:"Sparkling Rosé",abv:12,p:1600,v:["750ml"],taste:"Berry & Festive",notes:"Strawberry cherry bubble"},
  {b:"Moët & Chandon Brut",c:"wine",o:"France",f:"🇫🇷",e:"🍷",t:"Champagne",abv:12,p:5500,v:["750ml"],taste:"Luxurious & Crisp",notes:"Green apple citrus brioche"},
  {b:"Veuve Clicquot Yellow Label",c:"wine",o:"France",f:"🇫🇷",e:"🍷",t:"Champagne",abv:12,p:6800,v:["750ml"],taste:"Rich & Toasty",notes:"Toast biscuit citrus fruit"},
  {b:"Krug Grande Cuvée",c:"wine",o:"France",f:"🇫🇷",e:"🍷",t:"Champagne",abv:12,p:22000,v:["750ml"],taste:"Complex & Prestigious",notes:"Brioche hazelnut honey citrus"},
  {b:"Penfolds Bin 389",c:"wine",o:"Australia",f:"🇦🇺",e:"🍷",t:"Red Wine",abv:14.5,p:4500,v:["750ml"],taste:"Bold & Structured",notes:"Blackcurrant oak chocolate mint"},
  {b:"Ruffino Chianti",c:"wine",o:"Italy",f:"🇮🇹",e:"🍷",t:"Red Wine",abv:13,p:1800,v:["750ml"],taste:"Classic & Cherry",notes:"Cherry plum herbs earthy"},
  {b:"Casillero del Diablo Cabernet",c:"wine",o:"Chile",f:"🇨🇱",e:"🍷",t:"Red Wine",abv:13.5,p:1200,v:["750ml"],taste:"Fruity & Spicy",notes:"Cassis cherry tobacco spice"},
  {b:"Santa Margherita Pinot Grigio",c:"wine",o:"Italy",f:"🇮🇹",e:"🍷",t:"White Wine",abv:12.5,p:2800,v:["750ml"],taste:"Crisp & Mineral",notes:"Apple peach mineral dry"},
  {b:"Cloudy Bay Sauvignon Blanc",c:"wine",o:"New Zealand",f:"🇳🇿",e:"🍷",t:"White Wine",abv:13.5,p:3500,v:["750ml"],taste:"Vibrant & Zesty",notes:"Passionfruit lime grapefruit"},

  // ── BRANDY ──
  {b:"Morpheus Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:950,v:["750ml","375ml","180ml"],taste:"Smooth & Fruity",notes:"Grape fruit caramel"},
  {b:"Morpheus XO",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Premium Brandy",abv:42.8,p:1500,v:["750ml"],taste:"Rich & Aged",notes:"Oak vanilla dried fruit"},
  {b:"McDowell's No.1 Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:520,v:["750ml","375ml","180ml"],taste:"Rich & Bold",notes:"Grape oak bold"},
  {b:"Honey Bee Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:480,v:["750ml","375ml","180ml"],taste:"Sweet & Warm",notes:"Honey grape warm"},
  {b:"Hennessy VS",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:5500,v:["750ml"],taste:"Rich & Oak",notes:"Vanilla oak fruit"},
  {b:"Hennessy VSOP",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:8500,v:["750ml"],taste:"Velvety & Complex",notes:"Honey vanilla dried fruit"},
  {b:"Hennessy XO",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:22000,v:["750ml"],taste:"Extraordinary",notes:"Chocolate pepper candied fruit oak"},
  {b:"Remy Martin VSOP",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:7500,v:["750ml"],taste:"Fruity & Floral",notes:"Jasmine peach vanilla"},
  {b:"Remy Martin XO",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:18000,v:["750ml"],taste:"Opulent & Complex",notes:"Plum jasmine hazelnut cinnamon"},
  {b:"Old Admiral Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:420,v:["750ml","375ml","180ml"],taste:"Bold & Warm",notes:"Grape bold warm"},
  {b:"Mansion House Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:380,v:["750ml","375ml","180ml"],taste:"Rich & Smooth",notes:"Grape smooth warm"},
  {b:"KF Brandy",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Brandy",abv:42.8,p:350,v:["750ml","375ml"],taste:"Simple & Warm",notes:"Grape simple bold"},
  {b:"John Exshaw",c:"brandy",o:"India",f:"🇮🇳",e:"🥃",t:"Premium Brandy",abv:42.8,p:1800,v:["750ml"],taste:"Premium & Aged",notes:"Oak vanilla rich aged"},
  {b:"Courvoisier VS",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:5200,v:["750ml"],taste:"Smooth & Fruity",notes:"Apple grape vanilla"},
  {b:"Martell VS",c:"brandy",o:"France",f:"🇫🇷",e:"🥃",t:"Cognac",abv:40,p:5000,v:["750ml"],taste:"Smooth & Round",notes:"Fruit wood smooth"},

  // ── TEQUILA ──
  {b:"Jose Cuervo Especial Gold",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Gold Tequila",abv:40,p:2800,v:["750ml"],taste:"Smooth & Sweet",notes:"Agave caramel vanilla"},
  {b:"Jose Cuervo Especial Silver",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Silver Tequila",abv:40,p:2600,v:["750ml"],taste:"Clean & Agave",notes:"Agave citrus pepper"},
  {b:"Jose Cuervo Tradicional",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Reposado",abv:40,p:3500,v:["750ml"],taste:"Oak & Agave",notes:"Agave oak spice"},
  {b:"Patron Silver",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Premium Silver",abv:40,p:5800,v:["750ml"],taste:"Smooth & Citrus",notes:"Citrus agave pepper"},
  {b:"Patron Reposado",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Premium Reposado",abv:40,p:6500,v:["750ml"],taste:"Oak & Honey",notes:"Oak vanilla honey agave"},
  {b:"Patron Anejo",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Premium Anejo",abv:40,p:7500,v:["750ml"],taste:"Rich & Oaky",notes:"Oak vanilla dried fruit smoke"},
  {b:"Don Julio Blanco",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Premium Blanco",abv:40,p:6200,v:["750ml"],taste:"Crisp & Agave",notes:"Agave citrus black pepper"},
  {b:"Don Julio Reposado",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Reposado",abv:40,p:7200,v:["750ml"],taste:"Aged & Complex",notes:"Agave oak vanilla caramel"},
  {b:"Don Julio 1942",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Ultra Premium",abv:40,p:22000,v:["750ml"],taste:"Extraordinary",notes:"Caramel butterscotch chocolate roasted agave"},
  {b:"Olmeca Gold",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Gold Tequila",abv:38,p:2400,v:["750ml"],taste:"Sweet & Smooth",notes:"Agave caramel smooth"},
  {b:"Camino Real Gold",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Gold Tequila",abv:40,p:2200,v:["750ml"],taste:"Warm & Agave",notes:"Agave vanilla warm"},
  {b:"Sauza Gold",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Gold Tequila",abv:40,p:2000,v:["750ml"],taste:"Bold & Agave",notes:"Agave pepper bold"},
  {b:"Herradura Plata",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Silver",abv:40,p:5500,v:["750ml"],taste:"Herbal & Agave",notes:"Agave herbs citrus"},
  {b:"Casamigos Blanco",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Premium Blanco",abv:40,p:5800,v:["750ml"],taste:"Vanilla & Agave",notes:"Vanilla agave citrus smooth"},
  {b:"Casamigos Reposado",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Reposado",abv:40,p:6500,v:["750ml"],taste:"Caramel & Oak",notes:"Oak caramel cocoa agave"},
  {b:"El Jimador Reposado",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Reposado",abv:40,p:2400,v:["750ml"],taste:"Smooth & Spicy",notes:"Agave vanilla pepper"},
  {b:"1800 Silver",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Silver",abv:40,p:4200,v:["750ml"],taste:"Sweet & Clean",notes:"Agave butter pepper fruit"},
  {b:"Espolon Blanco",c:"tequila",o:"Mexico",f:"🇲🇽",e:"🌵",t:"Blanco",abv:40,p:3200,v:["750ml"],taste:"Floral & Peppery",notes:"Agave tropical pineapple pepper"},
];

// ── Price multipliers per city ──
const CM: Record<string, number> = {
  "Mumbai":1.0,"Delhi":0.92,"Bangalore":1.05,"Gurgaon":0.93,"Goa":0.82,"Kolkata":0.95,
  "Hyderabad":1.02,"Chennai":1.15,"Pune":0.98,"Jaipur":0.96,"Lucknow":0.94,"Chandigarh":0.91,
  "Ahmedabad":1.30,"Indore":0.93,"Bhopal":0.94,"Noida":0.93,"Ghaziabad":0.93,"Faridabad":0.93,
  "Kochi":1.22,"Thiruvananthapuram":1.25,"Mangalore":1.06,"Mysore":1.04,"Hubli-Dharwad":1.03,
  "Pondicherry":0.80,"Nagpur":0.99,"Visakhapatnam":1.01,"Ranchi":0.97,"Dehradun":0.90,
  "Shimla":0.89,"Panaji":0.82,
};

// Volume multiplier
function vm(v: string): number {
  const m: Record<string,number> = {"1L":1.33,"750ml":1,"500ml":0.7,"650ml":0.88,"440ml":0.6,"375ml":0.55,"355ml":0.48,"330ml":0.45,"180ml":0.3,"90ml":0.18};
  return m[v] ?? 1;
}

function slug(b: string, v: string): string {
  return `${b}-${v}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function faqs(b: BrandDef, v: string) {
  return [
    {question:`What is the price of ${b.b} ${v} in India?`,answer:`${b.b} ${v} is priced around ₹${Math.round(b.p*vm(v))} in most Indian cities. Prices vary by state due to excise duties.`},
    {question:`Is ${b.b} good?`,answer:`${b.b} is a ${b.t} from ${b.o} with ${b.taste.toLowerCase()} character with notes of ${b.notes}.`},
    {question:`What goes well with ${b.b}?`,answer:`${b.b} pairs well with ${b.c==="beer"?"spicy snacks and kebabs":b.c==="wine"?"cheese and pasta":"water, soda, or cola"}.`},
    {question:`What is the ABV of ${b.b}?`,answer:`${b.b} has an alcohol content of ${b.abv}% ABV.`},
  ];
}

// Programmatic variant expansion: add special editions, cask finishes, limited editions
function expandVariants(): Array<{brand: BrandDef; volume: string}> {
  const variants: Array<{brand: BrandDef; volume: string}> = [];
  
  // Base variants from all brands
  for (const b of B) {
    for (const v of b.v) {
      variants.push({brand: b, volume: v});
    }
  }
  
  // Programmatic expansions for spirits (not beer/wine)
  const EDITIONS = ["Limited Edition","Festive Pack","Gift Box","Miniature Set"];
  const CASK_FINISHES = ["Sherry Cask","Port Cask","Rum Cask","Wine Cask","Bourbon Cask"];
  
  // Add special editions for top brands
  for (const b of B) {
    if (b.c === "beer" || b.c === "wine") continue;
    if (b.p < 1000) continue; // Only for mid+ tier brands
    
    // Add 1 special edition
    const ed = EDITIONS[Math.floor(b.p % EDITIONS.length)];
    variants.push({
      brand: {...b, b: `${b.b} ${ed}`, p: Math.round(b.p * 1.15), t: `${b.t} Special`},
      volume: "750ml"
    });
    
    // Add cask finish for premium whisky/rum
    if ((b.c === "whisky" || b.c === "rum") && b.p >= 2000) {
      const cf = CASK_FINISHES[Math.floor(b.p % CASK_FINISHES.length)];
      variants.push({
        brand: {...b, b: `${b.b} ${cf} Finish`, p: Math.round(b.p * 1.25), t: `${b.t} Cask Finish`, taste: `${cf.replace(" Cask","")} & Rich`, notes: `${cf.toLowerCase()} ${b.notes}`},
        volume: "750ml"
      });
    }
  }
  
  // Add additional volume variants for popular Indian brands
  for (const b of B) {
    if (b.o !== "India") continue;
    if (b.c === "beer") continue;
    
    const existingVols = new Set(b.v);
    const extraVols = ["750ml","375ml","180ml","90ml"].filter(v => !existingVols.has(v));
    
    for (const v of extraVols.slice(0, 2)) {
      variants.push({brand: b, volume: v});
    }
  }
  
  // Create "value pack" variants for popular beers
  for (const b of B) {
    if (b.c !== "beer") continue;
    if (b.p >= 200) {
      variants.push({
        brand: {...b, b: `${b.b} Can`, p: Math.round(b.p * 0.9)},
        volume: "500ml"
      });
    }
  }
  
  return variants;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const body = await req.json().catch(() => ({}));
    const batchStart = body.batch_start ?? 0;
    const batchSize = body.batch_size ?? 100;
    const mode = body.mode ?? "full";

    const { data: cats } = await sb.from("categories").select("id, slug");
    const catMap = new Map(cats?.map((c: any) => [c.slug.toLowerCase(), c.id]) ?? []);

    const { data: cities } = await sb.from("cities").select("id, name");
    const cityMap = new Map(cities?.map((c: any) => [c.name, c.id]) ?? []);

    const allVariants = expandVariants();
    const batch = allVariants.slice(batchStart, batchStart + batchSize);
    
    if (batch.length === 0) {
      return new Response(JSON.stringify({ done: true, total: allVariants.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let productsInserted = 0;
    let pricesInserted = 0;

    // Insert products
    if (mode === "full" || mode === "products") {
      const products = batch.map(({ brand: b, volume: v }) => {
        const s = slug(b.b, v);
        return {
          name: `${b.b} ${v}`, brand: b.b, category_id: catMap.get(b.c) || null,
          volume: v, abv: b.abv, origin: b.o, origin_flag: b.f,
          image_emoji: b.e, type_tag: b.t, taste_profile: b.taste,
          tasting_notes: b.notes, rating: +(3.5 + Math.random() * 1.3).toFixed(1),
          slug: s,
          description: `${b.b} is a premium ${b.t.toLowerCase()} ${b.c} from ${b.o}. Known for its ${b.taste.toLowerCase()} character.`,
          meta_title: `${b.b} ${v} Price in India 2026 | Bevory`,
          meta_description: `Check ${b.b} ${v} price across 30+ Indian cities. ${b.taste} ${b.c} from ${b.o}.`,
          faqs: faqs(b, v),
          is_trending: b.p > 2000,
        };
      });

      const { error } = await sb.from("products").upsert(products, { onConflict: "slug", ignoreDuplicates: true });
      if (error) console.error("Product err:", error.message);
      else productsInserted = products.length;
    }

    // Insert prices
    if (mode === "full" || mode === "prices") {
      const slugs = batch.map(({ brand: b, volume: v }) => slug(b.b, v));
      const { data: prods } = await sb.from("products").select("id, slug").in("slug", slugs);
      const prodMap = new Map(prods?.map((p: any) => [p.slug, p.id]) ?? []);

      const prices: any[] = [];
      for (const { brand: b, volume: v } of batch) {
        const s = slug(b.b, v);
        const pid = prodMap.get(s);
        if (!pid) continue;
        const bp = Math.round(b.p * vm(v));
        for (const [cn, mult] of Object.entries(CM)) {
          const cid = cityMap.get(cn);
          if (!cid) continue;
          const j = 0.97 + Math.random() * 0.06;
          prices.push({ product_id: pid, city_id: cid, price: Math.round(bp * mult * j), volume: v, mrp: Math.round(bp * mult * j * 1.05) });
        }
      }

      for (let i = 0; i < prices.length; i += 500) {
        const chunk = prices.slice(i, i + 500);
        const { error } = await sb.from("product_prices").insert(chunk);
        if (error) console.error("Price err:", error.message);
        else pricesInserted += chunk.length;
      }
    }

    return new Response(JSON.stringify({
      success: true, batch_start: batchStart, batch_end: batchStart + batch.length,
      total_variants: allVariants.length, products_inserted: productsInserted, prices_inserted: pricesInserted,
      next_batch: batchStart + batchSize < allVariants.length ? batchStart + batchSize : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});
