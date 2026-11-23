// بيانات الفروع الكاملة من CSV (مضمنة مباشرة)
const branches = [
  [
    {
        "id": "Az-Branch-0001",
        "branch": "Adly Mansour Metro Station",
        "address": "Adly Mansour Central Station, 10th Park inside Metro Station",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/cCoGeE3rBNz1in5k6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.147076,
        "longitude": 31.421225
    },
    {
        "id": "Az-Branch-0002",
        "branch": "Agora Mall",
        "address": "Agora Mall - Ground Floor - Fifth Settlement",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/tDFSwg3iHs7r7Cie7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0204966,
        "longitude": 31.528987
    },
    {
        "id": "Az-Branch-0003",
        "branch": "Ain Shams Law",
        "address": "Ain Shams University - Faculty of Law",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/AV7oNVy3zv1ELvBz8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0748834,
        "longitude": 31.2864456
    },
    {
        "id": "Az-Branch-0004",
        "branch": "Ain Shams University",
        "address": "Ain Shams University -Faculty Of Commerce",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/LGGAzW8ZAf7pYVz49",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0746829,
        "longitude": 31.2873348
    },
    {
        "id": "Az-Branch-0005",
        "branch": "Ain Shams University 3",
        "address": "Ain Shams University - Faculty of Arts",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/ubdBiMwJz1ofBZKc9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0767007,
        "longitude": 31.287256
    },
    {
        "id": "Az-Branch-0006",
        "branch": "AirPort T1",
        "address": "Old Airport T1",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/q3bVw53xkvkSTyVY6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1282778,
        "longitude": 31.4025278
    },
    {
        "id": "Az-Branch-0007",
        "branch": "AirPort T2",
        "address": "New Airport Terminal 2",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/acYTr6K66V12g5gV7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1116111,
        "longitude": 31.4023889
    },
    {
        "id": "Az-Branch-0008",
        "branch": "AirPort T2-G",
        "address": "Airport T2 in front of the Multi Garage",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/2yj2q8Lvr3SYtuPr7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1142693,
        "longitude": 31.4022617
    },
    {
        "id": "Az-Branch-0009",
        "branch": "AirPort T3-F",
        "address": "New Airport 3 - corridor F",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/dwB7C6nbsmmdHup27",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1103817,
        "longitude": 31.3986981
    },
    {
        "id": "Az-Branch-0010",
        "branch": "AirPort T3-G",
        "address": "New Airport 3 - corridor G",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/LNAnfYghUxvz4DKa7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1098611,
        "longitude": 31.3899722
    },
    {
        "id": "Az-Branch-0011",
        "branch": "Al Far Market",
        "address": "South 90th Street, Fifth Settlement, in front of Concord Plaza Mall.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/hBdajgjKRiKwizs68",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0260887,
        "longitude": 31.4834156
    },
    {
        "id": "Az-Branch-0012",
        "branch": "Al Husseini to go",
        "address": "Al-Husseiny Mall, Al-Tagamoa, next to the first Nakheel Compound, New Cairo, Cairo Governorate",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/QgtpeeRQtzSKS2tBA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0633118,
        "longitude": 31.4450664
    },
    {
        "id": "Az-Branch-0013",
        "branch": "Al Qasr Al Ainy",
        "address": "93 Kasr El Aini Street, Shop No. 13/9, next to Rosa El Youssef",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/QX7FJT9c3cxH7xTp6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.035662,
        "longitude": 31.2339415
    },
    {
        "id": "Az-Branch-0014",
        "branch": "Al Rehab - Eastern Market",
        "address": "Food Court",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/9NsrymCfMnZCbqPG8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0710762,
        "longitude": 31.514647
    },
    {
        "id": "Az-Branch-0015",
        "branch": "Al-Ahly Club Al-Jazira",
        "address": "Al-Tetch Stadium in front of the halls gate",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/ahi3wAVxyLpubKaJA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0439971,
        "longitude": 31.2224035
    },
    {
        "id": "Az-Branch-0016",
        "branch": "Al-Manara 1",
        "address": "International Conference Center El-Moshir Tantawy Axis -next to Hall 1",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/XzdhdTJMkSDMxhAQ9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.014307,
        "longitude": 31.3846512
    },
    {
        "id": "Az-Branch-0017",
        "branch": "Al-Manara 2",
        "address": "International Conference Center El-Moshir Tantawy Axis -next to Hall 4",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/XzdhdTJMkSDMxhAQ9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.014307,
        "longitude": 31.3846512
    },
    {
        "id": "Az-Branch-0018",
        "branch": "Almaza Avenue branch",
        "address": "Almaza Avenue New Mall next to Misr Aviation Hospital - Heliopolis",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/xvBehnUFj96AgD8H6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0927336,
        "longitude": 31.3474932
    },
    {
        "id": "Az-Branch-0019",
        "branch": "Arabella",
        "address": "Arabella New Mall, Third Settlement, Next to Ezz El Din Pharmacy, New Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/hzDm6h8BC2dC4UHS8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9915895,
        "longitude": 31.4320094
    },
    {
        "id": "Az-Branch-0020",
        "branch": "Avenue Mall -Al Rehab",
        "address": "Avenue Mall, next to the Civil Registry, second floor, New Cairo, Rehab, Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/E5hpiSJcoJ41C9Yr9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0585518,
        "longitude": 31.5091062
    },
    {
        "id": "Az-Branch-0021",
        "branch": "Bavaria Town El-Maadi",
        "address": "12 Bavaria Town beside EG-Bank infront of El Baron",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/f1bTqVRgSAeGRNc98",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9808865,
        "longitude": 31.340971
    },
    {
        "id": "Az-Branch-0022",
        "branch": "Cairo Festival City 1",
        "address": "Ring Road with the ninety Street In front of the fountain , next to the Police Academy",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/gMdKQZVhuY1tGbqb6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0305315,
        "longitude": 31.4074042
    },
    {
        "id": "Az-Branch-0023",
        "branch": "Carrefour - Al Rehab",
        "address": "Avenue Mall - Group 130 Al Rehab 2, Al Rehab City",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/YgT9F7Kymfu4hfDP9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0579448,
        "longitude": 31.509505
    },
    {
        "id": "Az-Branch-0024",
        "branch": "Carrefour - Al Zaytoun",
        "address": "El-Aziz Bellah, El-Zaytoun Sharkeya, Zaytoun",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/g4cbyDvgDC7GZoZv7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0994727,
        "longitude": 31.3145251
    },
    {
        "id": "Az-Branch-0025",
        "branch": "Carrefour - Mirage Mall",
        "address": "Carrefour Market - Mirage Mall -The 1st Settlement",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/c3VxYAYnWKCENm9h7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0796107,
        "longitude": 31.4545719
    },
    {
        "id": "Az-Branch-0026",
        "branch": "Carrefour - Mivida",
        "address": "90th Street . Mivida Compound-5th Settlement",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/wqik8ufv9WKBNHW1A",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0177715,
        "longitude": 31.5344212
    },
    {
        "id": "Az-Branch-0027",
        "branch": "Carrefour - Saraya Mall",
        "address": "Extension of Wali Al Aahd St , Hadaeq Al Qubbah",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/kMsrucabsiAM358w7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0876712,
        "longitude": 31.283871
    },
    {
        "id": "Az-Branch-0028",
        "branch": "Carrefour Golf Salah Salem",
        "address": "Salah Salem Road beside Air Force House , Nasr City -Cairo",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/tEqrwqnYuwrQCM5J7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0824734,
        "longitude": 31.3216359
    },
    {
        "id": "Az-Branch-0029",
        "branch": "Carrefour- City Center Almaza",
        "address": "Suez Road, Sheraton Al Matar, Nasr City.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/w1ZJy375FvhWq5xH9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0817356,
        "longitude": 31.3649561
    },
    {
        "id": "Az-Branch-0030",
        "branch": "Carrefour-Al Hamad Mall",
        "address": "79 Axis, First New Cairo",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/h4PbnaCPcYB3CrP27",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0028909,
        "longitude": 31.4243558
    },
    {
        "id": "Az-Branch-0031",
        "branch": "Carrefour-Helwan",
        "address": "Mostafa Fahmy Street, Helwan, Cairo.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/dVhXCUZZfWGza32T9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.8500284,
        "longitude": 31.325404
    },
    {
        "id": "Az-Branch-0032",
        "branch": "Carrefour-Mega Mall",
        "address": "Carrefour Mega Mall - 5th Settlement - New Cairo.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/Pyu7w1onEUXwidoz5",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9790989,
        "longitude": 31.4340882
    },
    {
        "id": "Az-Branch-0033",
        "branch": "Carrefour-New Maadi",
        "address": "Carrefour New Maadi.",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/pn5MGmXFKGCN6LPb7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9826933,
        "longitude": 31.3158296
    },
    {
        "id": "Az-Branch-0034",
        "branch": "Carrefour-Tiba Mall",
        "address": "4 Anwar Mufti.st, - Al Nasser Street - Nasr City",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/MFcKoio1uPU662iX6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0676097,
        "longitude": 31.3300705
    },
    {
        "id": "Az-Branch-0035",
        "branch": "Carrefour-Tora Al Asmnt",
        "address": "55 Corniche El Nil, Tora Al Asmnt, Maadi",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/M8gRuY2H26spMKZX7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9291416,
        "longitude": 31.2816489
    },
    {
        "id": "Az-Branch-0036",
        "branch": "CFC 2",
        "address": "Ring Road with the ninety Street next to Carrefour , next to the Police Academy",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/ea2n2gkGVzUvfgUZ8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0305315,
        "longitude": 31.4074042
    },
    {
        "id": "Az-Branch-0037",
        "branch": "ChillOut AlRehab",
        "address": "Chillout Gas station - Al Rehab - New Cairo.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/RWfKL1BueiUhKYEg7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0728444,
        "longitude": 31.4740266
    },
    {
        "id": "Az-Branch-0038",
        "branch": "ChillOut AlShouyfat",
        "address": "The entrance to AlShouyfat - the first entrance to the Compound Golf Katameya - Gas station Chillout.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/upnXQ4b6jMZZ2RcX6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0060293,
        "longitude": 31.3998837
    },
    {
        "id": "Az-Branch-0039",
        "branch": "City Center Almaza",
        "address": "Almaza Airport, Sheraton ,Airport, Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/xzShV5NhMo6VGCfd7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0807204,
        "longitude": 31.3649881
    },
    {
        "id": "Az-Branch-0040",
        "branch": "City Center Maadi 2",
        "address": "Ring Road - Eastern Basateen - Al Basateen - Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/UhuQfiBRGZyJdbRa9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9833473,
        "longitude": 31.3163386
    },
    {
        "id": "Az-Branch-0041",
        "branch": "City Stars 1",
        "address": "Omar Ibn El Khattab St ,City Stars Mall , 1st Floor , Nasr City",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/g1iT1qSxeRaWcif26",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0739545,
        "longitude": 31.3443307
    },
    {
        "id": "Az-Branch-0042",
        "branch": "City Stars 3",
        "address": "Omar Ibn El Khattab St ,City Stars Mall , 4th Floor , Nasr City",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/g1iT1qSxeRaWcif26",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0739545,
        "longitude": 31.3443307
    },
    {
        "id": "Az-Branch-0043",
        "branch": "Civilization Museum",
        "address": "Civilization Museum - Al Fustat",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/Kh6HwDatBpo4xtTa9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.00841,
        "longitude": 31.248246
    },
    {
        "id": "Az-Branch-0044",
        "branch": "College of Education",
        "address": "Faculty of Education, in front of ChillOut Roxy gas station inside the college",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/jeu5QFPEp1jUtSRF6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0917708,
        "longitude": 31.3104575
    },
    {
        "id": "Az-Branch-0045",
        "branch": "Concord Plaza",
        "address": "Ninety Street, Fifth Settlement, Concord Plaza Mall",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/DZ5c5rx7bzUtnkDJ9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0248976,
        "longitude": 31.4825881
    },
    {
        "id": "Az-Branch-0046",
        "branch": "District 5 Mall",
        "address": "District 5 Mall-Ain El Soukhna Road-Industrial Area",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/RAsQs8hgjBAGEewk8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9729167,
        "longitude": 31.4554722
    },
    {
        "id": "Az-Branch-0047",
        "branch": "Down Town Mall",
        "address": "Ninety Street, Fifth Settlement",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/ZtVDDa38EhpdKSn68",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0167616,
        "longitude": 31.4118863
    },
    {
        "id": "Az-Branch-0048",
        "branch": "East Hub Madinaty",
        "address": "East Hub Mall Madinaty front of Craft Zone",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/LmRxShwCr9NDhxUv9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0735556,
        "longitude": 31.6736667
    },
    {
        "id": "Az-Branch-0049",
        "branch": "Egypt Station 1",
        "address": "Egypt Station , Ramsis Square, Al Fagalah, Al Azbakeya, Cairo Governorate",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/xCpugxzkiTpMLg189",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0632299,
        "longitude": 31.2469369
    },
    {
        "id": "Az-Branch-0050",
        "branch": "Egypt Station 2",
        "address": "Misr Station, Ramses Square, Faggala, Azbakeya, Cairo Governorate, in front of the station",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/xCpugxzkiTpMLg189",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0632299,
        "longitude": 31.2469369
    },
    {
        "id": "Az-Branch-0051",
        "branch": "El Korba",
        "address": "18 Nazih Khalifa Street, El Korba, Heliopolis, in front of Al-Thawra Hospital , Next to CIB Bank",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/v9PCxE8ibNvozbct7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0907595,
        "longitude": 31.326635
    },
    {
        "id": "Az-Branch-0052",
        "branch": "El Maadi",
        "address": "62 Street 9 next to the Maadi Sknat station",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/NpH1VCqTiSXcEAwA6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9554934,
        "longitude": 31.2615387
    },
    {
        "id": "Az-Branch-0053",
        "branch": "El Manial",
        "address": "81 Main Manial Street.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/yhqCevNgGcXrNjQJ7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.02275,
        "longitude": 31.22575
    },
    {
        "id": "Az-Branch-0054",
        "branch": "Fathalla Market-Al Rehab",
        "address": "Sadat Axis , Beginning of New Cairo , Cairo Governorate",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/LZhZve8kxJrkaJHc7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0540963,
        "longitude": 31.4913072
    },
    {
        "id": "Az-Branch-0055",
        "branch": "Fresh Food Market-Point 90",
        "address": "In front of American University Gate 5 - Point 90 Mall",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/7w54UNjQNtxoVqAL8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0197434,
        "longitude": 31.49475
    },
    {
        "id": "Az-Branch-0056",
        "branch": "Gateway Mall - Al Rehab",
        "address": "Gateway Mall, next to Alfa Market, Gate 13, Al Rehab",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/M2Skfw4pNEAqtD9G8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0638046,
        "longitude": 31.4792175
    },
    {
        "id": "Az-Branch-0057",
        "branch": "G",
        "address": "Chillout ElChouyfat Gas Station, next to Triumph Hotel Fifth Settlement , New Cairo",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/r6HM1SAJ2zmK56Ho7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0063838,
        "longitude": 31.4003963
    },
    {
        "id": "Az-Branch-0058",
        "branch": "Girls College",
        "address": "Girls College- Merghany - inside the college",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/oJc4GeXNtvpCGhuRA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0811095,
        "longitude": 31.3289564
    },
    {
        "id": "Az-Branch-0059",
        "branch": "Global Medical City",
        "address": "Al Manteqah al Sadesah, Nasr City, Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/C4ewx5x9xt84e68B8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0538578,
        "longitude": 31.3136444
    },
    {
        "id": "Az-Branch-0060",
        "branch": "Go Bus",
        "address": "Sixth district, Next to Zanusi Company Nasr City, Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/xATXybKmy4P9xy58A",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0464349,
        "longitude": 31.3185799
    },
    {
        "id": "Az-Branch-0061",
        "branch": "Hadayek Al Kobba",
        "address": "156 Egypt and Sudan Street, next to Al-Youm Fish Restaurant",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/c8J8HnhMnahZZ6wE8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0871201,
        "longitude": 31.2879295
    },
    {
        "id": "Az-Branch-0062",
        "branch": "Heliopolis star",
        "address": "Heliopolis Star",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/qfcBCgXbxRdEoeSYA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9863056,
        "longitude": 31.5301389
    },
    {
        "id": "Az-Branch-0063",
        "branch": "Helwan",
        "address": "40 Ragheb Street, intersection of Mohamed Sayed Ahmed Street, in front of KFC and Jad Restaurant",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/iBv2jCzVxnwu9tgT7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.847434,
        "longitude": 31.331683
    },
    {
        "id": "Az-Branch-0064",
        "branch": "Helwan University",
        "address": "Helwan University - next to the commercial center - and runway 4",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/BCQWNDqhB2KFAR1D8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.8666956,
        "longitude": 31.317214
    },
    {
        "id": "Az-Branch-0065",
        "branch": "Lake House",
        "address": "Lake House, 90th Street, next to Doucid Hotel, inside Lake House Club",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/aCDviJhqmrHgzXqj7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.024044,
        "longitude": 31.4544754
    },
    {
        "id": "Az-Branch-0066",
        "branch": "Lake View",
        "address": "Ninety Street, behind the Air Force Hospital, Fifth Settlement",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/TjutLCT46KNRJBsW6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0195058,
        "longitude": 31.4359909
    },
    {
        "id": "Az-Branch-0067",
        "branch": "lulu Heliopolis",
        "address": "Lulu District Mall - Wadi Degla after National Gas Station",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/GeCYYoKvbGXBM4sE7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.091003,
        "longitude": 31.3807897
    },
    {
        "id": "Az-Branch-0068",
        "branch": "Lulu Market-New Cairo",
        "address": "First Settlement, Lulu Market Mall, next to the Police Academy, first floor",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/3hyfFLWgvHtgtBWF9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0533679,
        "longitude": 31.4307569
    },
    {
        "id": "Az-Branch-0069",
        "branch": "Maadi 50",
        "address": "50th Street Zahraa Al Maadi, next to KFC and QNB Bank",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/hfmjGV8SZVM2jED56",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9725084,
        "longitude": 31.3150692
    },
    {
        "id": "Az-Branch-0070",
        "branch": "Maadi Laselki St.",
        "address": "Street 216, Ezbet Fahmy, From Laselki St.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/KQ9P67kNMutU4UEc8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9712222,
        "longitude": 31.2796111
    },
    {
        "id": "Az-Branch-0071",
        "branch": "Madinaty",
        "address": "Madinaty Road in front of Carrefour",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/37Trn15YFRUAPmbL8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1071425,
        "longitude": 31.6292891
    },
    {
        "id": "Az-Branch-0072",
        "branch": "Madinaty Food Hall",
        "address": "Open Air Mall Building F",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/Pm5vHeCrZzbdhYqNA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1062393,
        "longitude": 31.6260204
    },
    {
        "id": "Az-Branch-0073",
        "branch": "Madinaty-Craft Zone",
        "address": "Madinaty ,Craft Zone , New Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/U9wUDiDNgE9tmY1J9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0728092,
        "longitude": 31.6693134
    },
    {
        "id": "Az-Branch-0074",
        "branch": "Makram Ebeid",
        "address": "90 Makram Ebeid Street, Nasr City, next to Cafe Beanos",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/eDkUf1DMsP2pevNm6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0657406,
        "longitude": 31.3443344
    },
    {
        "id": "Az-Branch-0075",
        "branch": "Merghany branch",
        "address": "105 El-Sayed El-Marghani Street, Heliopolis, next to tortina For Sweets",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/DBJRkhjaqMo7LzAd7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0883033,
        "longitude": 31.33811
    },
    {
        "id": "Az-Branch-0076",
        "branch": "Metro Ahly Club",
        "address": "17 El Ahram St., In front of Normandy Cinema , El Korba",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/PfzRCZBsfqWScjW87",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0913137,
        "longitude": 31.3221881
    },
    {
        "id": "Az-Branch-0077",
        "branch": "Metro Genena Mall",
        "address": "6 El-Batrawy St",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/ngYEA4fk8mYRYz1X7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0603793,
        "longitude": 31.3307936
    },
    {
        "id": "Az-Branch-0078",
        "branch": "Metro Heliopolis",
        "address": "18 Al Khalifa Al Ma'mun, Manshiet al-Bakri",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/ZwDZ33Zw1CN4V7p96",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0870089,
        "longitude": 31.3033767
    },
    {
        "id": "Az-Branch-0079",
        "branch": "Metro Market - El Korba",
        "address": "17 El Ahram St., In front of Normandy Cinema , El Korba",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/Q7vhuuwMsdtVpo889",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0913136,
        "longitude": 31.322188
    },
    {
        "id": "Az-Branch-0080",
        "branch": "Metro Market - Roxi",
        "address": "Booth18 Al Khalifa Al Ma'mun, Manshiet al-Bakri",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/dNCbvm9bXqNdUqEN9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0869953,
        "longitude": 31.3033774
    },
    {
        "id": "Az-Branch-0081",
        "branch": "Metro Market-Al Ahly Club",
        "address": "84 Hassan Ma'moon, Al Manteqah as Sadesah, Ahly Club St, Nasr City",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/ibr5k1hsfwyyZXbq5",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0678065,
        "longitude": 31.3565308
    },
    {
        "id": "Az-Branch-0082",
        "branch": "Metro Market-Al Mokattam",
        "address": "16, 9 Street El Nafoura Sq. Mokattam, Cairo In Front Of National Bank Of Egypt",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/yDxBR4RZXMhLJw8X8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0148165,
        "longitude": 31.2809539
    },
    {
        "id": "Az-Branch-0083",
        "branch": "Metro Market-Al Rehab",
        "address": "Ground Floor, Rehab Mall, Talaat Mostafa Street.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/7unXh2dT6mU8M31Q9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0616667,
        "longitude": 31.4816667
    },
    {
        "id": "Az-Branch-0084",
        "branch": "Metro Market-Maadi",
        "address": "53 Masr - Helwan Agriculture Road, Maadi.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/S5GeHJFNGnqJkhw69",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9651961,
        "longitude": 31.2487462
    },
    {
        "id": "Az-Branch-0085",
        "branch": "Metro Market-Panorama Mall",
        "address": "Inside Panorama El Shorouk Mall, El Shorouk City, New Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/1E5CmFJsmkEng2QX8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1367527,
        "longitude": 31.6131535
    },
    {
        "id": "Az-Branch-0086",
        "branch": "Mivida",
        "address": "The Fifth Settlement, after the American University, the club inside the Mivida Compound",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/W5wAKE9HK9nkw5fY6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0074668,
        "longitude": 31.536321
    },
    {
        "id": "Az-Branch-0087",
        "branch": "Mokattam",
        "address": "23 , 9 Street , Mokattam.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/etMZwjQigyL2rXTW9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.014225,
        "longitude": 31.2848225
    },
    {
        "id": "Az-Branch-0088",
        "branch": "Morshedy Degla View",
        "address": "Middle plateau,Salah El Din St. Gate (B31), in front of Carrefour and Adidas store",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/mYUn1PgKxC12mZjXA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9855462,
        "longitude": 31.3222179
    },
    {
        "id": "Az-Branch-0089",
        "branch": "Morshedy One Kattameya",
        "address": "One Kattameya - Al Morshedy Complex - Mohamed Zaki Square - Building 214",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/akdvbWgJtGTUUg7S8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9810426,
        "longitude": 31.3563967
    },
    {
        "id": "Az-Branch-0090",
        "branch": "Mostafa El Nahas",
        "address": "16 Mostafa El Nahhas, 6th District, Nasr City, next to Primus Pizza",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/aqhY9D6EQBktMzM67",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0541432,
        "longitude": 31.3416494
    },
    {
        "id": "Az-Branch-0091",
        "branch": "Negmet Heliopolis - Shiraton",
        "address": "Market Jamal Salama next to Nuzha Traffic Department - Sheraton",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/sKcGtVEQjMbaUdHP8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0982355,
        "longitude": 31.3816101
    },
    {
        "id": "Az-Branch-0092",
        "branch": "Negmet Heliopolis-Gamee Square",
        "address": "5 Al Ramla street, El-Bostan, Heliopolis, Cairo Governorate",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/RPTeZwdiEZ9x8q1B8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0955042,
        "longitude": 31.3289679
    },
    {
        "id": "Az-Branch-0093",
        "branch": "Open Air 2 - Madinty",
        "address": "Open Air Mall - next to Asfour Crystal Shop",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/EsHa2vU3j3VQdHPH7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1077047,
        "longitude": 31.624416
    },
    {
        "id": "Az-Branch-0094",
        "branch": "Open Air 3 - Madinty",
        "address": "Open Air Mall -Kids Area-Polt C",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/hgwPzLJ9DWqhdsPp9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1070405,
        "longitude": 31.6280742
    },
    {
        "id": "Az-Branch-0095",
        "branch": "Oscar Grand Stores - Heliopolis",
        "address": "105 Omar Ibn El-Khattab, Almazah, Heliopolis",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/4KKGJUEM8DrTzxRH9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0873291,
        "longitude": 31.3457867
    },
    {
        "id": "Az-Branch-0096",
        "branch": "Oscar Grand Stores - Maadi",
        "address": "Main Zahraa Street in Zahraa Al Maadi, Rihana Plaza Tower , near to Vodafone",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/yYnzajoRb87Z9GFKA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9611396,
        "longitude": 31.2969722
    },
    {
        "id": "Az-Branch-0097",
        "branch": "Oscar Grand Stores-Tagamoa",
        "address": "Plot 425, 90th Street. Sector 3, 5th Compound, New cairo.",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/WGGrVAAs7xQn2VzMA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0277111,
        "longitude": 31.488742
    },
    {
        "id": "Az-Branch-0098",
        "branch": "Panda ElMaadi",
        "address": "7A Nile Corniche, Dallah Tower, Maadi District, Cairo",
        "branch_type": "Booth",
        "link": "https://maps.google.com/maps?q=29.961395631.2472813&z=17&hl=en",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9613956,
        "longitude": 31.2472813
    },
    {
        "id": "Az-Branch-0099",
        "branch": "Panda Market",
        "address": "7 El-Nasr Rd, 6th District, Nasr City",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/BRFsEG73CparcMdGA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0685844,
        "longitude": 31.3428459
    },
    {
        "id": "Az-Branch-0100",
        "branch": "Pearl Mall",
        "address": "Pearl Mall, 90th Street intersection on the main axis",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/WeWSBfsk8K3n1qxa6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0023038,
        "longitude": 31.5032772
    },
    {
        "id": "Az-Branch-0101",
        "branch": "Petrojet",
        "address": "Petrojet branch inside the company. Working hours are from Sunday to Thursday from 8 am to 3 pm",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/RNM7WKXUCoMwfNEa7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0202248,
        "longitude": 31.4143922
    },
    {
        "id": "Az-Branch-0102",
        "branch": "Petrojet Booth",
        "address": "Petrojet Company, 90th Street, next to Downtown Mall",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/DEcvdLuLSUQzod6x9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0202248,
        "longitude": 31.4143922
    },
    {
        "id": "Az-Branch-0103",
        "branch": "Qasr El-Nil",
        "address": "56 Qasr El Nil in front of Wafa Bank & Alex Bank",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/VwrGXTnJqUWqeNpE7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0492997,
        "longitude": 31.2463302
    },
    {
        "id": "Az-Branch-0104",
        "branch": "Residence Hotel",
        "address": "Residence Hotel - First Settlement-Inside the Hotel",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/c6NshQgjNERzeHsk7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0387263,
        "longitude": 31.4401181
    },
    {
        "id": "Az-Branch-0105",
        "branch": "Royal House Al Shorouk",
        "address": "El Sadat Rd, El Shorouk, beside Terrace Mall",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/LSKuW4Tvc53u3C8p8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1526071,
        "longitude": 31.6268152
    },
    {
        "id": "Az-Branch-0106",
        "branch": "Royal House Market-Merryland",
        "address": "6 Roxy St, in front of Merryland Park behind Othman Ahmed Othman Buildings",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/uC2VYyj3SZkE62Su9",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0958364,
        "longitude": 31.3149386
    },
    {
        "id": "Az-Branch-0107",
        "branch": "Seoudi Market-City Stars",
        "address": "Omar Ibn El Khattab St ,City Stars Mall , Nasr City",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/sui4wWBJmfvKeo12A",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0740178,
        "longitude": 31.345573
    },
    {
        "id": "Az-Branch-0108",
        "branch": "Seoudi Market-Water Way",
        "address": "22 A, The Waterway Compound, New cairo, Inside W Mall, Ground Floor.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/PBMyhgdMvvtP4qYL7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0406391,
        "longitude": 31.4754475
    },
    {
        "id": "Az-Branch-0109",
        "branch": "Sheraton Heliopolis",
        "address": "24 Sayed Zakaria Street Sheraton , In front of cilantro",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/mCY8bCvs4TwJCvVv8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1029414,
        "longitude": 31.3734759
    },
    {
        "id": "Az-Branch-0110",
        "branch": "Sherif St.",
        "address": "13 Sherif Street, Downtown, next to the Ministry of Endowments",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/c4VM3P1fJi3FgYu27",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0466728,
        "longitude": 31.24225
    },
    {
        "id": "Az-Branch-0111",
        "branch": "Shorouk Sky Plaza",
        "address": "El Shorouk City, Gate 1, Cairo Ismailia Road",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/JEVCiy2TCjcXVQKg7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1739617,
        "longitude": 31.5941382
    },
    {
        "id": "Az-Branch-0112",
        "branch": "Shoubra",
        "address": "70th Shoubra Street , Between Massara & Rood El Farag.",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/LJ8N6abPWV491AQ99",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0759771,
        "longitude": 31.2450538
    },
    {
        "id": "Az-Branch-0113",
        "branch": "Shoubra 2",
        "address": "41 A Shubra Street",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/9Had4yBkSaHBG9BD8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0661537,
        "longitude": 31.2449558
    },
    {
        "id": "Az-Branch-0114",
        "branch": "Sixty Walk Mall",
        "address": "Administrative Capital, Government District, next to the Ministry of Finance, Sixty Mall",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/apP5cMxSoHVr6bAo7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0117601,
        "longitude": 31.7395431
    },
    {
        "id": "Az-Branch-0115",
        "branch": "South Gate New cairo",
        "address": "90th Street, South Gate Mall, next to Banque Misr, the front side parallel to Concord Plaza Mall",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/fEpFjhn1sr9hrEg27",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0255585,
        "longitude": 31.4795685
    },
    {
        "id": "Az-Branch-0116",
        "branch": "Spinneys Al-Shorouk",
        "address": "City Plaza Mall - Al-Shuhada Road - next to the British University and Al-Shorouk Academy - Al-Shorouk",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/VkVNNBsXX8HqpUBp6",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1144124,
        "longitude": 31.6066092
    },
    {
        "id": "Az-Branch-0117",
        "branch": "Spinneys Maxim Mall",
        "address": "North 90th Street,Inside Spinneys Maxim Mall,Fifth Settlement",
        "branch_type": "Booth",
        "link": "https://maps.app.goo.gl/BUTj1tZqDmwayizEA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0294848,
        "longitude": 31.49659
    },
    {
        "id": "Az-Branch-0118",
        "branch": "Spinneys-Arena Mall",
        "address": "Banks Center , 90th Street , First New Cairo.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/wp2YqwJcDG2ev9H47",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.018422,
        "longitude": 31.4254821
    },
    {
        "id": "Az-Branch-0119",
        "branch": "Spinneys-Maadi",
        "address": "Street 250, Maadi at Sarayat Al Gharbeyah, opposite to Maadi Grand Mall.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/zzJK2bNZR2SFVS8A7",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9662934,
        "longitude": 31.2699352
    },
    {
        "id": "Az-Branch-0120",
        "branch": "Spinneys-Pearl Des Rois",
        "address": "End of AUC St, beside Banque Misr, 3rd Settlement",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/PfknvHxXunu6vrrY8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0034301,
        "longitude": 31.5035802
    },
    {
        "id": "Az-Branch-0121",
        "branch": "Spinneys-Zahraa Al-Maadi",
        "address": "Hub, 50 Mall Zahraa Al Maadi, Cairo",
        "branch_type": "Branch",
        "link": "https://goo.gl/maps/LhAUQZqTZqSa2dpQA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 29.9679497,
        "longitude": 31.3147981
    },
    {
        "id": "Az-Branch-0122",
        "branch": "The Park Mall",
        "address": "Park Mall ,5th Settlement, in front of Lulu Hypermarket beside Porto Cairo Hotel near to American Uni.",
        "branch_type": "Booth",
        "link": "https://goo.gl/maps/zjRa5qDosrUr8KJf8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0267131,
        "longitude": 31.4980109
    },
    {
        "id": "Az-Branch-0123",
        "branch": "Tseppas - Genena Mall",
        "address": "9 El Batrawy Street, Genena Mall, Nasr City",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/CnRxwhD31VjUz6wBA",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.0609375,
        "longitude": 31.3326875
    },
    {
        "id": "Az-Branch-0124",
        "branch": "Tseppas Heliopolis",
        "address": "45 Abu Bakr Al-Siddiq St., Intersection of Haroun St., Court Square, Heliopolis, Cairo, in front of Al-Nasr Schools.",
        "branch_type": "Branch",
        "link": "https://maps.app.goo.gl/HEctf2R2vbdi7UVp8",
        "icon": "https://al-azab.co/img/icon-5060.png",
        "latitude": 30.1009521,
        "longitude": 31.3329315
    }
 ]
]
// المتغيرات العامة
let map;
let markers = [];
let infoWindow;

// دالة تهيئة الخريطة الرئيسية
function initializeMap() {
    console.log("جاري تهيئة الخريطة...");
    
    // مركز الخريطة الأولي (القاهرة)
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: { lat: 30.0444, lng: 31.2357 },
        mapTypeId: 'roadmap',
        styles: [
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#444444"}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#f2f2f2"}]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [{"saturation": -100}, {"lightness": 45}]
            },
            {
                "featureType": "road.highway",
                "elementType": "all",
                "stylers": [{"visibility": "simplified"}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [{"color": "#3498db"}, {"visibility": "on"}]
            }
        ]
    });

    // إنشاء العلامات وعرض القائمة
    setMarkers(map);
    displayBranchesList();
    setupEventListeners();
    
    console.log("تم تحميل " + branches.length + " فرع بنجاح");
    
    // تحديث العداد في الهيدر
    document.getElementById('totalBranches').textContent = branches.length;
    document.getElementById('resultsCount').textContent = branches.length;
}

function setMarkers(map) {
    const bounds = new google.maps.LatLngBounds();
    let validMarkersCount = 0;
    
    branches.forEach(branch => {
        // تخطي الفروع ذات الإحداثيات غير الصحيحة
        if (branch.latitude === 30.802498 && branch.longitude === 26.820553) {
            console.warn("تخطي فرع بإحداثيات افتراضية:", branch.branch);
            return;
        }

        // التأكد من أن الإحداثيات صالحة
        if (!branch.latitude || !branch.longitude) {
            console.error("إحداثيات غير صالحة للفرع:", branch.branch);
            return;
        }

        const marker = new google.maps.Marker({
            position: { lat: branch.latitude, lng: branch.longitude },
            map: map,
            title: branch.branch,
            icon: {
                url: branch.branch_type === 'Branch' 
                    ? 'https://al-azab.co/img/icon-5060.png'
                    : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#e67e22" stroke="white" stroke-width="2"/>
                            <circle cx="16" cy="16" r="6" fill="white"/>
                        </svg>
                    `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });

        marker.addListener('click', () => {
            showBranchInfo(branch);
        });

        markers.push(marker);
        bounds.extend(marker.getPosition());
        validMarkersCount++;
    });

    // ضبط عرض الخريطة ليشمل جميع العلامات
    if (validMarkersCount > 0) {
        map.fitBounds(bounds);
        console.log("تم إضافة " + validMarkersCount + " علامة على الخريطة");
    } else {
        console.error("لم يتم إضافة أي علامات على الخريطة");
        // عرض رسالة خطأ للمستخدم
        const mapElement = document.getElementById('map');
        mapElement.innerHTML = `
            <div class="map-placeholder" style="text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #e74c3c;"></i>
                <h3>لا توجد فروع متاحة للعرض</h3>
                <p>يرجى التحقق من اتصال الإنترنت أو تحديث الصفحة</p>
            </div>
        `;
    }
}

function displayBranchesList(filteredBranches = branches) {
    const branchesList = document.getElementById('branchesList');
    const resultsCount = document.getElementById('resultsCount');
    
    branchesList.innerHTML = '';
    resultsCount.textContent = filteredBranches.length;

    if (filteredBranches.length === 0) {
        branchesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>لا توجد نتائج مطابقة للبحث</p>
            </div>
        `;
        return;
    }

    filteredBranches.forEach(branch => {
        const branchItem = document.createElement('div');
        branchItem.className = 'branch-item';
        branchItem.innerHTML = `
            <div class="branch-name">
                <i class="fas ${branch.branch_type === 'Branch' ? 'fa-store' : 'fa-kiosk'}"></i>
                ${branch.branch}
            </div>
            <div class="branch-address">${branch.address}</div>
            <span class="branch-type ${branch.branch_type}">
                ${branch.branch_type === 'Branch' ? 'فرع رئيسي' : 'كشك'}
            </span>
        `;

        branchItem.addEventListener('click', () => {
            // إزالة النشاط من جميع العناصر
            document.querySelectorAll('.branch-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // إضافة النشاط للعنصر المحدد
            branchItem.classList.add('active');
            
            // إظهار معلومات الفرع
            showBranchInfo(branch);
            
            // التمرير إلى العلامة على الخريطة
            const marker = markers.find(m => 
                m.getPosition().lat() === branch.latitude && 
                m.getPosition().lng() === branch.longitude
            );
            if (marker) {
                map.panTo(marker.getPosition());
                map.setZoom(15);
            }
        });

        branchesList.appendChild(branchItem);
    });
}

function showBranchInfo(branch) {
    const branchInfo = document.getElementById('branchInfo');
    const branchInfoContent = document.getElementById('branchInfoContent');
    
    branchInfoContent.innerHTML = `
        <h3>${branch.branch}</h3>
        <p><strong>العنوان:</strong> ${branch.address}</p>
        <p><strong>نوع الفرع:</strong> ${branch.branch_type === 'Branch' ? 'فرع رئيسي' : 'كشك'}</p>
        <p><strong>رقم المعرف:</strong> ${branch.id}</p>
        <a href="${branch.link}" target="_blank" style="background: #27ae60;">
            <i class="fas fa-external-link-alt"></i>
            عرض على الخريطة
        </a>
    `;
    
    branchInfo.style.display = 'block';
}

function closeBranchInfo() {
    document.getElementById('branchInfo').style.display = 'none';
}

function setupEventListeners() {
    // البحث
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', filterBranches);

    // التصفية حسب النوع
    const typeFilter = document.getElementById('typeFilter');
    typeFilter.addEventListener('change', filterBranches);
    
    // إغلاق معلومات الفرع عند النقر خارجها
    document.addEventListener('click', (e) => {
        const branchInfo = document.getElementById('branchInfo');
        if (branchInfo.style.display === 'block' && !branchInfo.contains(e.target)) {
            closeBranchInfo();
        }
    });
}

function filterBranches() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = branch.branch.toLowerCase().includes(searchTerm) || 
                             branch.address.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || branch.branch_type === typeFilter;
        
        return matchesSearch && matchesType;
    });

    displayBranchesList(filteredBranches);
    
    // تحديث العلامات على الخريطة
    updateMapMarkers(filteredBranches);
}

function updateMapMarkers(filteredBranches) {
    // إخفاء جميع العلامات
    markers.forEach(marker => marker.setMap(null));
    
    // إظهار العلامات المرشحة فقط
    markers.forEach(marker => {
        const branch = branches.find(b => 
            b.latitude === marker.getPosition().lat() && 
            b.longitude === marker.getPosition().lng()
        );
        
        if (branch && filteredBranches.includes(branch)) {
            marker.setMap(map);
        }
    });
}

// التعامل مع الأخطاء
window.addEventListener('error', function(e) {
    console.error('حدث خطأ:', e.error);
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>حدث خطأ في تحميل التطبيق</h3>
                <p>يرجى تحديث الصفحة أو المحاولة لاحقاً</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    تحديث الصفحة
                </button>
            </div>
        `;
    }
});

// جعل الدوال متاحة عالمياً
window.initializeMap = initializeMap;
window.closeBranchInfo = closeBranchInfo;
window.filterBranches = filterBranches;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log("تم تحميل الصفحة، في انتظار Google Maps API...");
    
    // عرض عدد الفروع في الواجهة حتى قبل تحميل الخريطة
    document.getElementById('totalBranches').textContent = branches.length;
    document.getElementById('resultsCount').textContent = branches.length;
});
