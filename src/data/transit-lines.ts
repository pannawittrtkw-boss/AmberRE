// Bangkok rail transit lines (BTS/MRT/ARL/SRT) — station order, official
// line colors, and real-world coordinates, for drawing route overlays on
// the property search map. Sourced from the open Bangkok-Transit-Planner
// dataset (github.com/Full-Stack-boi/Bangkok-Transit-Planner), trimmed to
// just what the map needs. Each line lists its own stations in physical
// order; an interchange station appears once per line it serves (same
// coordinates, different id), which is intentional — it lets each line be
// drawn as one continuous polyline.

export interface TransitStation {
  id: string;
  nameTh: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export interface TransitLine {
  id: string;
  nameTh: string;
  nameEn: string;
  operator: string;
  color: string;
  stations: TransitStation[];
}

export const TRANSIT_LINES: TransitLine[] = [
  {
    "id": "BTS_SUKHUMVIT",
    "nameTh": "สายสุขุมวิท",
    "nameEn": "Sukhumvit Line",
    "operator": "BTS",
    "color": "#7DC242",
    "stations": [
      {
        "id": "BTS_N24",
        "nameTh": "คูคต",
        "nameEn": "Khu Khot",
        "lat": 13.932336,
        "lng": 100.646563
      },
      {
        "id": "BTS_N23",
        "nameTh": "แยก คปอ.",
        "nameEn": "Yaek Kor Por Aor",
        "lat": 13.924936,
        "lng": 100.625812
      },
      {
        "id": "BTS_N22",
        "nameTh": "พิพิธภัณฑ์กองทัพอากาศ",
        "nameEn": "Royal Thai Air Force Museum",
        "lat": 13.917909,
        "lng": 100.621695
      },
      {
        "id": "BTS_N21",
        "nameTh": "โรงพยาบาลภูมิพลอดุลยเดช",
        "nameEn": "Bhumibol Adulyadej Hospital",
        "lat": 13.910741,
        "lng": 100.617431
      },
      {
        "id": "BTS_N20",
        "nameTh": "สะพานใหม่",
        "nameEn": "Saphan Mai",
        "lat": 13.896587,
        "lng": 100.609137
      },
      {
        "id": "BTS_N19",
        "nameTh": "สายหยุด",
        "nameEn": "Sai Yud",
        "lat": 13.888452,
        "lng": 100.604297
      },
      {
        "id": "BTS_N18",
        "nameTh": "พหลโยธิน 59",
        "nameEn": "Phahon Yothin 59",
        "lat": 13.882481,
        "lng": 100.600795
      },
      {
        "id": "BTS_N17",
        "nameTh": "วัดพระศรีมหาธาตุ",
        "nameEn": "Wat Phra Sri Mahathat",
        "lat": 13.875537,
        "lng": 100.596723
      },
      {
        "id": "BTS_N16",
        "nameTh": "กรมทหารราบที่ 11",
        "nameEn": "11th Infantry Regiment",
        "lat": 13.867345,
        "lng": 100.591846
      },
      {
        "id": "BTS_N15",
        "nameTh": "บางบัว",
        "nameEn": "Bang Bua",
        "lat": 13.855996,
        "lng": 100.585168
      },
      {
        "id": "BTS_N14",
        "nameTh": "กรมป่าไม้",
        "nameEn": "Royal Forest Department",
        "lat": 13.850319,
        "lng": 100.581831
      },
      {
        "id": "BTS_N13",
        "nameTh": "มหาวิทยาลัยเกษตรศาสตร์",
        "nameEn": "Kasetsart University",
        "lat": 13.842417,
        "lng": 100.577142
      },
      {
        "id": "BTS_N12",
        "nameTh": "เสนานิคม",
        "nameEn": "Sena Nikhom",
        "lat": 13.836493,
        "lng": 100.57368
      },
      {
        "id": "BTS_N11",
        "nameTh": "รัชโยธิน",
        "nameEn": "Ratchayothin",
        "lat": 13.829859,
        "lng": 100.56977
      },
      {
        "id": "BTS_N10",
        "nameTh": "พหลโยธิน 24",
        "nameEn": "Phahon Yothin 24",
        "lat": 13.824244,
        "lng": 100.566478
      },
      {
        "id": "BTS_N9",
        "nameTh": "ห้าแยกลาดพร้าว",
        "nameEn": "Ha Yaek Lat Phrao",
        "lat": 13.816415,
        "lng": 100.561961
      },
      {
        "id": "BTS_N8",
        "nameTh": "หมอชิต",
        "nameEn": "Mo Chit",
        "lat": 13.802387,
        "lng": 100.553729
      },
      {
        "id": "BTS_N7",
        "nameTh": "สะพานควาย",
        "nameEn": "Saphan Khwai",
        "lat": 13.793756,
        "lng": 100.549725
      },
      {
        "id": "BTS_N5",
        "nameTh": "อารีย์",
        "nameEn": "Ari",
        "lat": 13.779724,
        "lng": 100.544644
      },
      {
        "id": "BTS_N4",
        "nameTh": "สนามเป้า",
        "nameEn": "Sanam Pao",
        "lat": 13.772625,
        "lng": 100.542097
      },
      {
        "id": "BTS_N3",
        "nameTh": "อนุสาวรีย์ชัยสมรภูมิ",
        "nameEn": "Victory Monument",
        "lat": 13.76275,
        "lng": 100.537093
      },
      {
        "id": "BTS_N2",
        "nameTh": "พญาไท",
        "nameEn": "Phaya Thai",
        "lat": 13.756911,
        "lng": 100.533816
      },
      {
        "id": "BTS_N1",
        "nameTh": "ราชเทวี",
        "nameEn": "Ratchathewi",
        "lat": 13.751899,
        "lng": 100.531541
      },
      {
        "id": "BTS_CEN",
        "nameTh": "สยาม",
        "nameEn": "Siam",
        "lat": 13.745608,
        "lng": 100.534202
      },
      {
        "id": "BTS_E1",
        "nameTh": "ชิดลม",
        "nameEn": "Chit Lom",
        "lat": 13.744072,
        "lng": 100.543061
      },
      {
        "id": "BTS_E2",
        "nameTh": "เพลินจิต",
        "nameEn": "Phloen Chit",
        "lat": 13.74305,
        "lng": 100.548806
      },
      {
        "id": "BTS_E3",
        "nameTh": "นานา",
        "nameEn": "Nana",
        "lat": 13.740527,
        "lng": 100.555443
      },
      {
        "id": "BTS_E4",
        "nameTh": "อโศก",
        "nameEn": "Asok",
        "lat": 13.73706,
        "lng": 100.560326
      },
      {
        "id": "BTS_E5",
        "nameTh": "พร้อมพงษ์",
        "nameEn": "Phrom Phong",
        "lat": 13.730417,
        "lng": 100.569753
      },
      {
        "id": "BTS_E6",
        "nameTh": "ทองหล่อ",
        "nameEn": "Thong Lo",
        "lat": 13.72424,
        "lng": 100.578534
      },
      {
        "id": "BTS_E7",
        "nameTh": "เอกมัย",
        "nameEn": "Ekkamai",
        "lat": 13.71958,
        "lng": 100.585072
      },
      {
        "id": "BTS_E8",
        "nameTh": "พระโขนง",
        "nameEn": "Phra Khanong",
        "lat": 13.715164,
        "lng": 100.591272
      },
      {
        "id": "BTS_E9",
        "nameTh": "อ่อนนุช",
        "nameEn": "On Nut",
        "lat": 13.705604,
        "lng": 100.601031
      },
      {
        "id": "BTS_E10",
        "nameTh": "บางจาก",
        "nameEn": "Bang Chak",
        "lat": 13.696783,
        "lng": 100.605373
      },
      {
        "id": "BTS_E11",
        "nameTh": "ปุณณวิถี",
        "nameEn": "Punnawithi",
        "lat": 13.689326,
        "lng": 100.609034
      },
      {
        "id": "BTS_E12",
        "nameTh": "อุดมสุข",
        "nameEn": "Udom Suk",
        "lat": 13.679871,
        "lng": 100.609485
      },
      {
        "id": "BTS_E13",
        "nameTh": "บางนา",
        "nameEn": "Bang Na",
        "lat": 13.668118,
        "lng": 100.604662
      },
      {
        "id": "BTS_E14",
        "nameTh": "แบริ่ง",
        "nameEn": "Bearing",
        "lat": 13.661164,
        "lng": 100.601839
      },
      {
        "id": "BTS_E15",
        "nameTh": "สำโรง",
        "nameEn": "Samrong",
        "lat": 13.646175,
        "lng": 100.595644
      },
      {
        "id": "BTS_E16",
        "nameTh": "ปู่เจ้า",
        "nameEn": "Pu Chao",
        "lat": 13.637456,
        "lng": 100.592021
      },
      {
        "id": "BTS_E17",
        "nameTh": "ช้างเอราวัณ",
        "nameEn": "Chang Erawan",
        "lat": 13.621443,
        "lng": 100.590152
      },
      {
        "id": "BTS_E18",
        "nameTh": "โรงเรียนนายเรือ",
        "nameEn": "Royal Thai Naval Academy",
        "lat": 13.608594,
        "lng": 100.594852
      },
      {
        "id": "BTS_E19",
        "nameTh": "ปากน้ำ",
        "nameEn": "Pak Nam",
        "lat": 13.602066,
        "lng": 100.597099
      },
      {
        "id": "BTS_E20",
        "nameTh": "ศรีนครินทร์",
        "nameEn": "Srinagarindra",
        "lat": 13.592138,
        "lng": 100.608929
      },
      {
        "id": "BTS_E21",
        "nameTh": "แพรกษา",
        "nameEn": "Phraek Sa",
        "lat": 13.58428,
        "lng": 100.607901
      },
      {
        "id": "BTS_E22",
        "nameTh": "สายลวด",
        "nameEn": "Sai Luat",
        "lat": 13.577749,
        "lng": 100.605436
      },
      {
        "id": "BTS_E23",
        "nameTh": "เคหะฯ",
        "nameEn": "Kheha",
        "lat": 13.567165,
        "lng": 100.607927
      }
    ]
  },
  {
    "id": "BTS_SILOM",
    "nameTh": "สายสีลม",
    "nameEn": "Silom Line",
    "operator": "BTS",
    "color": "#006838",
    "stations": [
      {
        "id": "BTS_W1",
        "nameTh": "สนามกีฬาแห่งชาติ",
        "nameEn": "National Stadium",
        "lat": 13.746498,
        "lng": 100.529086
      },
      {
        "id": "BTS_CEN_SILOM",
        "nameTh": "สยาม",
        "nameEn": "Siam",
        "lat": 13.745608,
        "lng": 100.534202
      },
      {
        "id": "BTS_S1",
        "nameTh": "ราชดำริ",
        "nameEn": "Ratchadamri",
        "lat": 13.739454,
        "lng": 100.539444
      },
      {
        "id": "BTS_S2",
        "nameTh": "ศาลาแดง",
        "nameEn": "Sala Daeng",
        "lat": 13.728528,
        "lng": 100.534344
      },
      {
        "id": "BTS_S3",
        "nameTh": "ช่องนนทรี",
        "nameEn": "Chong Nonsi",
        "lat": 13.723786,
        "lng": 100.529414
      },
      {
        "id": "BTS_S4",
        "nameTh": "เซนต์หลุยส์",
        "nameEn": "Saint Louis",
        "lat": 13.720741,
        "lng": 100.526644
      },
      {
        "id": "BTS_S5",
        "nameTh": "สุรศักดิ์",
        "nameEn": "Surasak",
        "lat": 13.719196,
        "lng": 100.521416
      },
      {
        "id": "BTS_S6",
        "nameTh": "สะพานตากสิน",
        "nameEn": "Saphan Taksin",
        "lat": 13.718802,
        "lng": 100.514145
      },
      {
        "id": "BTS_S7",
        "nameTh": "กรุงธนบุรี",
        "nameEn": "Krung Thon Buri",
        "lat": 13.720902,
        "lng": 100.502613
      },
      {
        "id": "BTS_S8",
        "nameTh": "วงเวียนใหญ่",
        "nameEn": "Wongwian Yai",
        "lat": 13.721088,
        "lng": 100.49514
      },
      {
        "id": "BTS_S9",
        "nameTh": "โพธิ์นิมิตร",
        "nameEn": "Pho Nimit",
        "lat": 13.719229,
        "lng": 100.485926
      },
      {
        "id": "BTS_S10",
        "nameTh": "ตลาดพลู",
        "nameEn": "Talat Phlu",
        "lat": 13.714217,
        "lng": 100.476693
      },
      {
        "id": "BTS_S11",
        "nameTh": "วุฒากาศ",
        "nameEn": "Wutthakat",
        "lat": 13.713028,
        "lng": 100.46902
      },
      {
        "id": "BTS_S12",
        "nameTh": "บางหว้า",
        "nameEn": "Bang Wa",
        "lat": 13.720767,
        "lng": 100.457836
      }
    ]
  },
  {
    "id": "BTS_GOLD",
    "nameTh": "สายสีทอง",
    "nameEn": "Gold Line",
    "operator": "BTS",
    "color": "#C4A84E",
    "stations": [
      {
        "id": "BTS_G1",
        "nameTh": "กรุงธนบุรี",
        "nameEn": "Krung Thon Buri",
        "lat": 13.720902,
        "lng": 100.502613
      },
      {
        "id": "BTS_G2",
        "nameTh": "เจริญนคร",
        "nameEn": "Charoen Nakhon",
        "lat": 13.726464,
        "lng": 100.509036
      },
      {
        "id": "BTS_G3",
        "nameTh": "คลองสาน",
        "nameEn": "Khlong San",
        "lat": 13.730339,
        "lng": 100.507693
      }
    ]
  },
  {
    "id": "MRT_BLUE",
    "nameTh": "สายสีน้ำเงิน",
    "nameEn": "Blue Line",
    "operator": "MRT",
    "color": "#1E3A8A",
    "stations": [
      {
        "id": "MRT_BL01",
        "nameTh": "ท่าพระ",
        "nameEn": "Tha Phra",
        "lat": 13.729326,
        "lng": 100.474235
      },
      {
        "id": "MRT_BL02",
        "nameTh": "จรัญฯ 13",
        "nameEn": "Charan 13",
        "lat": 13.740068,
        "lng": 100.470867
      },
      {
        "id": "MRT_BL03",
        "nameTh": "ไฟฉาย",
        "nameEn": "Fai Chai",
        "lat": 13.755217,
        "lng": 100.469495
      },
      {
        "id": "MRT_BL04",
        "nameTh": "บางขุนนนท์",
        "nameEn": "Bang Khun Non",
        "lat": 13.763116,
        "lng": 100.473362
      },
      {
        "id": "MRT_BL05",
        "nameTh": "บางยี่ขัน",
        "nameEn": "Bang Yi Khan",
        "lat": 13.777411,
        "lng": 100.485373
      },
      {
        "id": "MRT_BL06",
        "nameTh": "สิรินธร",
        "nameEn": "Sirindhorn",
        "lat": 13.783618,
        "lng": 100.492985
      },
      {
        "id": "MRT_BL07",
        "nameTh": "บางพลัด",
        "nameEn": "Bang Phlat",
        "lat": 13.792338,
        "lng": 100.504835
      },
      {
        "id": "MRT_BL08",
        "nameTh": "บางอ้อ",
        "nameEn": "Bang O",
        "lat": 13.798859,
        "lng": 100.509737
      },
      {
        "id": "MRT_BL09",
        "nameTh": "บางโพ",
        "nameEn": "Bang Pho",
        "lat": 13.806364,
        "lng": 100.52102
      },
      {
        "id": "MRT_BL10",
        "nameTh": "เตาปูน",
        "nameEn": "Tao Poon",
        "lat": 13.80613,
        "lng": 100.530798
      },
      {
        "id": "MRT_BL11",
        "nameTh": "บางซื่อ",
        "nameEn": "Bang Sue",
        "lat": 13.802981,
        "lng": 100.539137
      },
      {
        "id": "MRT_BL12",
        "nameTh": "กำแพงเพชร",
        "nameEn": "Kamphaeng Phet",
        "lat": 13.797776,
        "lng": 100.548171
      },
      {
        "id": "MRT_BL13",
        "nameTh": "สวนจตุจักร",
        "nameEn": "Chatuchak Park",
        "lat": 13.802766,
        "lng": 100.55375
      },
      {
        "id": "MRT_BL14",
        "nameTh": "พหลโยธิน",
        "nameEn": "Phahon Yothin",
        "lat": 13.813152,
        "lng": 100.560902
      },
      {
        "id": "MRT_BL15",
        "nameTh": "ลาดพร้าว",
        "nameEn": "Lat Phrao",
        "lat": 13.806454,
        "lng": 100.572912
      },
      {
        "id": "MRT_BL16",
        "nameTh": "รัชดาภิเษก",
        "nameEn": "Ratchadaphisek",
        "lat": 13.798852,
        "lng": 100.574601
      },
      {
        "id": "MRT_BL17",
        "nameTh": "สุทธิสาร",
        "nameEn": "Sutthisan",
        "lat": 13.790071,
        "lng": 100.574128
      },
      {
        "id": "MRT_BL18",
        "nameTh": "ห้วยขวาง",
        "nameEn": "Huai Khwang",
        "lat": 13.778672,
        "lng": 100.573579
      },
      {
        "id": "MRT_BL19",
        "nameTh": "ศูนย์วัฒนธรรมแห่งประเทศไทย",
        "nameEn": "Thailand Cultural Centre",
        "lat": 13.76635,
        "lng": 100.570443
      },
      {
        "id": "MRT_BL20",
        "nameTh": "พระราม 9",
        "nameEn": "Phra Ram 9",
        "lat": 13.757346,
        "lng": 100.5653
      },
      {
        "id": "MRT_BL21",
        "nameTh": "เพชรบุรี",
        "nameEn": "Phetchaburi",
        "lat": 13.74933,
        "lng": 100.563489
      },
      {
        "id": "MRT_BL22",
        "nameTh": "สุขุมวิท",
        "nameEn": "Sukhumvit",
        "lat": 13.737668,
        "lng": 100.561469
      },
      {
        "id": "MRT_BL23",
        "nameTh": "ศูนย์การประชุมแห่งชาติสิริกิติ์",
        "nameEn": "Queen Sirikit National Convention Centre",
        "lat": 13.722941,
        "lng": 100.559697
      },
      {
        "id": "MRT_BL24",
        "nameTh": "คลองเตย",
        "nameEn": "Khlong Toei",
        "lat": 13.722292,
        "lng": 100.553985
      },
      {
        "id": "MRT_BL25",
        "nameTh": "ลุมพินี",
        "nameEn": "Lumphini",
        "lat": 13.725411,
        "lng": 100.5465
      },
      {
        "id": "MRT_BL26",
        "nameTh": "สีลม",
        "nameEn": "Si Lom",
        "lat": 13.729364,
        "lng": 100.537352
      },
      {
        "id": "MRT_BL27",
        "nameTh": "สามย่าน",
        "nameEn": "Sam Yan",
        "lat": 13.732498,
        "lng": 100.529427
      },
      {
        "id": "MRT_BL28",
        "nameTh": "หัวลำโพง",
        "nameEn": "Hua Lamphong",
        "lat": 13.737621,
        "lng": 100.517112
      },
      {
        "id": "MRT_BL29",
        "nameTh": "วัดมังกร",
        "nameEn": "Wat Mangkon",
        "lat": 13.742316,
        "lng": 100.509686
      },
      {
        "id": "MRT_BL30",
        "nameTh": "สามยอด",
        "nameEn": "Sam Yot",
        "lat": 13.746941,
        "lng": 100.503168
      },
      {
        "id": "MRT_BL31",
        "nameTh": "สนามไชย",
        "nameEn": "Sanam Chai",
        "lat": 13.743463,
        "lng": 100.494805
      },
      {
        "id": "MRT_BL32",
        "nameTh": "อิสรภาพ",
        "nameEn": "Itsaraphap",
        "lat": 13.739286,
        "lng": 100.484595
      },
      {
        "id": "MRT_BL01",
        "nameTh": "ท่าพระ",
        "nameEn": "Tha Phra",
        "lat": 13.729326,
        "lng": 100.474235
      },
      {
        "id": "MRT_BL33",
        "nameTh": "บางไผ่",
        "nameEn": "Bang Phai",
        "lat": 13.724608,
        "lng": 100.46525
      },
      {
        "id": "MRT_BL34",
        "nameTh": "บางหว้า",
        "nameEn": "Bang Wa",
        "lat": 13.720767,
        "lng": 100.457836
      },
      {
        "id": "MRT_BL35",
        "nameTh": "เพชรเกษม 48",
        "nameEn": "Phetkasem 48",
        "lat": 13.71544,
        "lng": 100.445606
      },
      {
        "id": "MRT_BL36",
        "nameTh": "ภาษีเจริญ",
        "nameEn": "Phasi Charoen",
        "lat": 13.712934,
        "lng": 100.434409
      },
      {
        "id": "MRT_BL37",
        "nameTh": "บางแค",
        "nameEn": "Bang Khae",
        "lat": 13.712083,
        "lng": 100.422861
      },
      {
        "id": "MRT_BL38",
        "nameTh": "หลักสอง",
        "nameEn": "Lak Song",
        "lat": 13.710851,
        "lng": 100.40952
      }
    ]
  },
  {
    "id": "MRT_PURPLE",
    "nameTh": "สายสีม่วง",
    "nameEn": "Purple Line",
    "operator": "MRT",
    "color": "#6B21A8",
    "stations": [
      {
        "id": "MRT_PP01",
        "nameTh": "คลองบางไผ่",
        "nameEn": "Khlong Bang Phai",
        "lat": 13.892498,
        "lng": 100.408265
      },
      {
        "id": "MRT_PP02",
        "nameTh": "ตลาดบางใหญ่",
        "nameEn": "Talad Bang Yai",
        "lat": 13.881153,
        "lng": 100.409279
      },
      {
        "id": "MRT_PP03",
        "nameTh": "สามแยกบางใหญ่",
        "nameEn": "Sam Yaek Bang Yai",
        "lat": 13.874732,
        "lng": 100.419364
      },
      {
        "id": "MRT_PP04",
        "nameTh": "บางพลู",
        "nameEn": "Bang Phlu",
        "lat": 13.875848,
        "lng": 100.433784
      },
      {
        "id": "MRT_PP05",
        "nameTh": "บางรักใหญ่",
        "nameEn": "Bang Rak Yai",
        "lat": 13.876679,
        "lng": 100.444917
      },
      {
        "id": "MRT_PP06",
        "nameTh": "บางรักน้อยท่าอิฐ",
        "nameEn": "Bang Rak Noi Tha It",
        "lat": 13.874895,
        "lng": 100.455992
      },
      {
        "id": "MRT_PP07",
        "nameTh": "ไทรม้า",
        "nameEn": "Sai Ma",
        "lat": 13.870481,
        "lng": 100.466682
      },
      {
        "id": "MRT_PP08",
        "nameTh": "สะพานพระนั่งเกล้า",
        "nameEn": "Phra Nang Klao Bridge",
        "lat": 13.870319,
        "lng": 100.480239
      },
      {
        "id": "MRT_PP09",
        "nameTh": "แยกนนทบุรี 1",
        "nameEn": "Yaek Nonthaburi 1",
        "lat": 13.865955,
        "lng": 100.494256
      },
      {
        "id": "MRT_PP10",
        "nameTh": "บางกระสอ",
        "nameEn": "Bang Krasor",
        "lat": 13.86165,
        "lng": 100.504659
      },
      {
        "id": "MRT_PP11",
        "nameTh": "ศูนย์ราชการนนทบุรี",
        "nameEn": "Nonthaburi Civic Center",
        "lat": 13.860189,
        "lng": 100.512994
      },
      {
        "id": "MRT_PP12",
        "nameTh": "กระทรวงสาธารณสุข",
        "nameEn": "Ministry of Public Health",
        "lat": 13.848482,
        "lng": 100.514724
      },
      {
        "id": "MRT_PP13",
        "nameTh": "แยกติวานนท์",
        "nameEn": "Yaek Tiwanon",
        "lat": 13.839543,
        "lng": 100.514973
      },
      {
        "id": "MRT_PP14",
        "nameTh": "วงศ์สว่าง",
        "nameEn": "Wong Sawang",
        "lat": 13.829816,
        "lng": 100.526499
      },
      {
        "id": "MRT_PP15",
        "nameTh": "บางซ่อน",
        "nameEn": "Bang Son",
        "lat": 13.820054,
        "lng": 100.532427
      },
      {
        "id": "MRT_PP16",
        "nameTh": "เตาปูน",
        "nameEn": "Tao Poon",
        "lat": 13.80613,
        "lng": 100.530798
      }
    ]
  },
  {
    "id": "MRT_YELLOW",
    "nameTh": "สายสีเหลือง",
    "nameEn": "Yellow Line",
    "operator": "MRT",
    "color": "#FBBF24",
    "stations": [
      {
        "id": "MRT_YL01",
        "nameTh": "ลาดพร้าว",
        "nameEn": "Lat Phrao",
        "lat": 13.806662,
        "lng": 100.574864
      },
      {
        "id": "MRT_YL02",
        "nameTh": "ภาวนา",
        "nameEn": "Phawana",
        "lat": 13.800128,
        "lng": 100.584246
      },
      {
        "id": "MRT_YL03",
        "nameTh": "โชคชัย 4",
        "nameEn": "Chok Chai 4",
        "lat": 13.794447,
        "lng": 100.59439
      },
      {
        "id": "MRT_YL04",
        "nameTh": "ลาดพร้าว 71",
        "nameEn": "Lat Phrao 71",
        "lat": 13.787319,
        "lng": 100.607145
      },
      {
        "id": "MRT_YL05",
        "nameTh": "ลาดพร้าว 83",
        "nameEn": "Lat Phrao 83",
        "lat": 13.783674,
        "lng": 100.613735
      },
      {
        "id": "MRT_YL06",
        "nameTh": "มหาดไทย",
        "nameEn": "Mahat Thai",
        "lat": 13.778072,
        "lng": 100.62371
      },
      {
        "id": "MRT_YL07",
        "nameTh": "ลาดพร้าว 101",
        "nameEn": "Lat Phrao 101",
        "lat": 13.774367,
        "lng": 100.630377
      },
      {
        "id": "MRT_YL08",
        "nameTh": "บางกะปิ",
        "nameEn": "Bang Kapi",
        "lat": 13.769007,
        "lng": 100.639852
      },
      {
        "id": "MRT_YL09",
        "nameTh": "แยกลำสาลี",
        "nameEn": "Yaek Lam Sali",
        "lat": 13.761953,
        "lng": 100.645582
      },
      {
        "id": "MRT_YL10",
        "nameTh": "ศรีกรีฑา",
        "nameEn": "Si Kritha",
        "lat": 13.750904,
        "lng": 100.644912
      },
      {
        "id": "MRT_YL11",
        "nameTh": "หัวหมาก",
        "nameEn": "Hua Mak",
        "lat": 13.736555,
        "lng": 100.641442
      },
      {
        "id": "MRT_YL12",
        "nameTh": "กลันตัน",
        "nameEn": "Kalantan",
        "lat": 13.725633,
        "lng": 100.641774
      },
      {
        "id": "MRT_YL13",
        "nameTh": "ศรีนุช",
        "nameEn": "Si Nut",
        "lat": 13.711086,
        "lng": 100.644175
      },
      {
        "id": "MRT_YL14",
        "nameTh": "ศรีนครินทร์ 38",
        "nameEn": "Srinagarindra 38",
        "lat": 13.700619,
        "lng": 100.646605
      },
      {
        "id": "MRT_YL15",
        "nameTh": "สวนหลวง ร.9",
        "nameEn": "Suan Luang Rama IX",
        "lat": 13.6908,
        "lng": 100.647125
      },
      {
        "id": "MRT_YL16",
        "nameTh": "ศรีอุดม",
        "nameEn": "Si Udom",
        "lat": 13.676549,
        "lng": 100.646164
      },
      {
        "id": "MRT_YL17",
        "nameTh": "ศรีเอี่ยม",
        "nameEn": "Si Iam",
        "lat": 13.667691,
        "lng": 100.645219
      },
      {
        "id": "MRT_YL18",
        "nameTh": "ศรีลาซาล",
        "nameEn": "Si La Salle",
        "lat": 13.65501,
        "lng": 100.642024
      },
      {
        "id": "MRT_YL19",
        "nameTh": "ศรีแบริ่ง",
        "nameEn": "Si Bearing",
        "lat": 13.643577,
        "lng": 100.636307
      },
      {
        "id": "MRT_YL20",
        "nameTh": "ศรีด่าน",
        "nameEn": "Si Dan",
        "lat": 13.633102,
        "lng": 100.630151
      },
      {
        "id": "MRT_YL21",
        "nameTh": "ศรีเทพา",
        "nameEn": "Si Thepha",
        "lat": 13.629992,
        "lng": 100.622556
      },
      {
        "id": "MRT_YL22",
        "nameTh": "ทิพวัล",
        "nameEn": "Thipphawan",
        "lat": 13.636685,
        "lng": 100.609928
      },
      {
        "id": "MRT_YL23",
        "nameTh": "สำโรง",
        "nameEn": "Samrong",
        "lat": 13.646175,
        "lng": 100.595644
      }
    ]
  },
  {
    "id": "ARL",
    "nameTh": "แอร์พอร์ต เรล ลิงก์",
    "nameEn": "Airport Rail Link",
    "operator": "ARL",
    "color": "#DC2626",
    "stations": [
      {
        "id": "ARL_A8",
        "nameTh": "พญาไท",
        "nameEn": "Phaya Thai",
        "lat": 13.756911,
        "lng": 100.533816
      },
      {
        "id": "ARL_A7",
        "nameTh": "ราชปรารภ",
        "nameEn": "Ratchaprarop",
        "lat": 13.754884,
        "lng": 100.542179
      },
      {
        "id": "ARL_A6",
        "nameTh": "มักกะสัน",
        "nameEn": "Makkasan",
        "lat": 13.750833,
        "lng": 100.561225
      },
      {
        "id": "ARL_A5",
        "nameTh": "รามคำแหง",
        "nameEn": "Ramkhamhaeng",
        "lat": 13.742942,
        "lng": 100.600056
      },
      {
        "id": "ARL_A4",
        "nameTh": "หัวหมาก",
        "nameEn": "Hua Mak",
        "lat": 13.737924,
        "lng": 100.644823
      },
      {
        "id": "ARL_A3",
        "nameTh": "บ้านทับช้าง",
        "nameEn": "Ban Thap Chang",
        "lat": 13.732799,
        "lng": 100.690751
      },
      {
        "id": "ARL_A2",
        "nameTh": "ลาดกระบัง",
        "nameEn": "Lat Krabang",
        "lat": 13.727635,
        "lng": 100.748424
      },
      {
        "id": "ARL_A1",
        "nameTh": "สุวรรณภูมิ",
        "nameEn": "Suvarnabhumi",
        "lat": 13.694134,
        "lng": 100.751265
      }
    ]
  },
  {
    "id": "MRT_PINK",
    "nameTh": "สายสีชมพู",
    "nameEn": "Pink Line",
    "operator": "MRT",
    "color": "#E9008C",
    "stations": [
      {
        "id": "MRT_PK01",
        "nameTh": "ศูนย์ราชการนนทบุรี",
        "nameEn": "Nonthaburi Civic Center",
        "lat": 13.860189,
        "lng": 100.512994
      },
      {
        "id": "MRT_PK02",
        "nameTh": "แคราย",
        "nameEn": "Khae Rai",
        "lat": 13.862716,
        "lng": 100.520603
      },
      {
        "id": "MRT_PK03",
        "nameTh": "สนามบินน้ำ",
        "nameEn": "Sanambin Nam",
        "lat": 13.874067,
        "lng": 100.516327
      },
      {
        "id": "MRT_PK04",
        "nameTh": "สามัคคี",
        "nameEn": "Samakkhi",
        "lat": 13.889284,
        "lng": 100.510566
      },
      {
        "id": "MRT_PK05",
        "nameTh": "กรมชลประทาน",
        "nameEn": "Royal Irrigation Department",
        "lat": 13.898511,
        "lng": 100.507092
      },
      {
        "id": "MRT_PK06",
        "nameTh": "แยกปากเกร็ด",
        "nameEn": "Yaek Pak Kret",
        "lat": 13.906294,
        "lng": 100.505413
      },
      {
        "id": "MRT_PK07",
        "nameTh": "เลี่ยงเมืองปากเกร็ด",
        "nameEn": "Pak Kret Bypass",
        "lat": 13.906535,
        "lng": 100.515537
      },
      {
        "id": "MRT_PK08",
        "nameTh": "แจ้งวัฒนะ-ปากเกร็ด 28",
        "nameEn": "Chaeng Watthana-Pak Kret 28",
        "lat": 13.904198,
        "lng": 100.52925
      },
      {
        "id": "MRT_PK09",
        "nameTh": "ศรีรัช",
        "nameEn": "Si Rat",
        "lat": 13.900584,
        "lng": 100.539987
      },
      {
        "id": "MRT_PK10",
        "nameTh": "เมืองทองธานี",
        "nameEn": "Muang Thong Thani",
        "lat": 13.897447,
        "lng": 100.54837
      },
      {
        "id": "MRT_PK11",
        "nameTh": "แจ้งวัฒนะ 14",
        "nameEn": "Chaeng Watthana 14",
        "lat": 13.893309,
        "lng": 100.560093
      },
      {
        "id": "MRT_PK12",
        "nameTh": "ศูนย์ราชการเฉลิมพระเกียรติ",
        "nameEn": "Government Complex",
        "lat": 13.89078,
        "lng": 100.567307
      },
      {
        "id": "MRT_PK13",
        "nameTh": "โทรคมนาคมแห่งชาติ",
        "nameEn": "National Telecom",
        "lat": 13.887577,
        "lng": 100.575603
      },
      {
        "id": "MRT_PK14",
        "nameTh": "หลักสี่",
        "nameEn": "Lak Si",
        "lat": 13.884158,
        "lng": 100.582603
      },
      {
        "id": "MRT_PK15",
        "nameTh": "ราชภัฏพระนคร",
        "nameEn": "Rajabhat Phranakhon",
        "lat": 13.879922,
        "lng": 100.589274
      },
      {
        "id": "MRT_PK16",
        "nameTh": "วัดพระศรีมหาธาตุ",
        "nameEn": "Wat Phra Sri Mahathat",
        "lat": 13.87484,
        "lng": 100.597075
      },
      {
        "id": "MRT_PK17",
        "nameTh": "รามอินทรา 3",
        "nameEn": "Ram Inthra 3",
        "lat": 13.870956,
        "lng": 100.602559
      },
      {
        "id": "MRT_PK18",
        "nameTh": "ลาดปลาเค้า",
        "nameEn": "Lat Pla Khao",
        "lat": 13.862806,
        "lng": 100.617756
      },
      {
        "id": "MRT_PK19",
        "nameTh": "รามอินทรา กม.4",
        "nameEn": "Ram Inthra Kor Mor 4",
        "lat": 13.858332,
        "lng": 100.626058
      },
      {
        "id": "MRT_PK20",
        "nameTh": "มัยลาภ",
        "nameEn": "Maiyalap",
        "lat": 13.854999,
        "lng": 100.632243
      },
      {
        "id": "MRT_PK21",
        "nameTh": "วัชรพล",
        "nameEn": "Vacharaphol",
        "lat": 13.849265,
        "lng": 100.642834
      },
      {
        "id": "MRT_PK22",
        "nameTh": "รามอินทรา กม.6",
        "nameEn": "Ram Inthra Kor Mor 6",
        "lat": 13.845208,
        "lng": 100.650194
      },
      {
        "id": "MRT_PK23",
        "nameTh": "คู้บอน",
        "nameEn": "Khu Bon",
        "lat": 13.840549,
        "lng": 100.658763
      },
      {
        "id": "MRT_PK24",
        "nameTh": "รามอินทรา กม.9",
        "nameEn": "Ram Inthra Kor Mor 9",
        "lat": 13.833788,
        "lng": 100.667454
      },
      {
        "id": "MRT_PK25",
        "nameTh": "วงแหวนรามอินทรา",
        "nameEn": "Outer Ring Road-Ram Inthra",
        "lat": 13.824482,
        "lng": 100.677067
      },
      {
        "id": "MRT_PK26",
        "nameTh": "นพรัตน์",
        "nameEn": "Nopparat",
        "lat": 13.816551,
        "lng": 100.685494
      },
      {
        "id": "MRT_PK27",
        "nameTh": "บางชัน",
        "nameEn": "Bang Chan",
        "lat": 13.81272,
        "lng": 100.702792
      },
      {
        "id": "MRT_PK28",
        "nameTh": "เศรษฐบุตรบำเพ็ญ",
        "nameEn": "Setthabutbamphen",
        "lat": 13.812683,
        "lng": 100.71248
      },
      {
        "id": "MRT_PK29",
        "nameTh": "ตลาดมีนบุรี",
        "nameEn": "Min Buri Market",
        "lat": 13.812514,
        "lng": 100.725687
      },
      {
        "id": "MRT_PK30",
        "nameTh": "มีนบุรี",
        "nameEn": "Min Buri",
        "lat": 13.808439,
        "lng": 100.73256
      }
    ]
  },
  {
    "id": "MRT_PINK_BRANCH",
    "nameTh": "สายสีชมพู (ส่วนต่อขยายเมืองทองธานี)",
    "nameEn": "Pink Line (Muang Thong Thani Extension)",
    "operator": "MRT",
    "color": "#E9008C",
    "stations": [
      {
        "id": "MRT_PK10",
        "nameTh": "เมืองทองธานี",
        "nameEn": "Muang Thong Thani",
        "lat": 13.897447,
        "lng": 100.54837
      },
      {
        "id": "MRT_MT01",
        "nameTh": "อิมแพ็ค เมืองทองธานี",
        "nameEn": "Impact Muang Thong Thani",
        "lat": 13.910901,
        "lng": 100.544326
      },
      {
        "id": "MRT_MT02",
        "nameTh": "ทะเลสาบเมืองทองธานี",
        "nameEn": "Lake Muang Thong Thani",
        "lat": 13.918305,
        "lng": 100.545651
      }
    ]
  },
  {
    "id": "SRT_RED_NORTH",
    "nameTh": "สายสีแดงเข้ม",
    "nameEn": "Dark Red Line",
    "operator": "SRT",
    "color": "#CF142B",
    "stations": [
      {
        "id": "SRT_RN00",
        "nameTh": "กรุงเทพอภิวัฒน์",
        "nameEn": "Krung Thep Aphiwat",
        "lat": 13.804696,
        "lng": 100.541767
      },
      {
        "id": "SRT_RN01",
        "nameTh": "จตุจักร",
        "nameEn": "Chatuchak",
        "lat": 13.826238,
        "lng": 100.549461
      },
      {
        "id": "SRT_RN02",
        "nameTh": "วัดเสมียนนารี",
        "nameEn": "Wat Samian Nari",
        "lat": 13.841712,
        "lng": 100.557651
      },
      {
        "id": "SRT_RN03",
        "nameTh": "บางเขน",
        "nameEn": "Bang Khen",
        "lat": 13.849454,
        "lng": 100.561745
      },
      {
        "id": "SRT_RN04",
        "nameTh": "ทุ่งสองห้อง",
        "nameEn": "Thung Song Hong",
        "lat": 13.860103,
        "lng": 100.567476
      },
      {
        "id": "SRT_RN05",
        "nameTh": "หลักสี่",
        "nameEn": "Lak Si",
        "lat": 13.886348,
        "lng": 100.581842
      },
      {
        "id": "SRT_RN06",
        "nameTh": "การเคหะฯ",
        "nameEn": "Kan Kheha",
        "lat": 13.898446,
        "lng": 100.58877
      },
      {
        "id": "SRT_RN07",
        "nameTh": "ดอนเมือง",
        "nameEn": "Don Mueang",
        "lat": 13.914777,
        "lng": 100.597915
      },
      {
        "id": "SRT_RN08",
        "nameTh": "หลักหก",
        "nameEn": "Lak Hok",
        "lat": 13.965833,
        "lng": 100.605341
      },
      {
        "id": "SRT_RN09",
        "nameTh": "รังสิต",
        "nameEn": "Rangsit",
        "lat": 13.990512,
        "lng": 100.602197
      }
    ]
  },
  {
    "id": "SRT_RED_WEST",
    "nameTh": "สายสีแดงอ่อน",
    "nameEn": "Light Red Line",
    "operator": "SRT",
    "color": "#E2001A",
    "stations": [
      {
        "id": "SRT_RN00",
        "nameTh": "กรุงเทพอภิวัฒน์",
        "nameEn": "Krung Thep Aphiwat",
        "lat": 13.804696,
        "lng": 100.541767
      },
      {
        "id": "SRT_RW01",
        "nameTh": "บางซ่อน",
        "nameEn": "Bang Son",
        "lat": 13.822116,
        "lng": 100.53424
      },
      {
        "id": "SRT_RW02",
        "nameTh": "บางบำหรุ",
        "nameEn": "Bang Bamru",
        "lat": 13.792183,
        "lng": 100.477442
      },
      {
        "id": "SRT_RW03",
        "nameTh": "ตลิ่งชัน",
        "nameEn": "Taling Chan",
        "lat": 13.789244,
        "lng": 100.440084
      }
    ]
  }
];
