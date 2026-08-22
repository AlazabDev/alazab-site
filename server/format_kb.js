const fs = require('fs');
const path = require('path');

const filePath = '/var/www/core/alazab.com/src/content/alazab_kb.json';
const backupPath = '/var/www/core/alazab.com/src/content/alazab_kb_backup.json';

// Read existing data
let rawData;
try {
    rawData = fs.readFileSync(filePath, 'utf8');
} catch (error) {
    console.error('Error reading file:', error);
    process.exit(1);
}

// Backup original file just in case
fs.writeFileSync(backupPath, rawData);
console.log('✅ Backup created at:', backupPath);

const data = JSON.parse(rawData);

function cleanCategory(cat) {
    if (!cat) return 'عام';
    let c = cat.toString();
    // Remove leading numbers, dashes
    c = c.replace(/^[0-9.\s-]+/, '');
    // Remove specific words like "تشمل", "وتشتمل على", ":"
    c = c.replace(/تشمل على|وتشتمل على|تشمل|وتشمل/g, '');
    c = c.replace(/[:،؛.-]/g, '');
    c = c.trim();
    
    // Grouping
    if (c.includes('ال الصحية') || c.includes('سباكة')) return 'السباكة والصرف';
    if (c.includes('كهرباء')) return 'الكهرباء والإنارة';
    if (c.includes('تكييف')) return 'التكييف والتهوية';
    if (c.includes('دهانات')) return 'الدهانات والتشطيبات';
    if (c.includes('عازلة') || c.includes('العزل')) return 'العزل المائي والحراري';
    if (c.includes('بياض')) return 'البياض والمحارة';
    if (c.includes('هدم') || c.includes('تكسير')) return 'الهدم والتكسير';
    if (c.includes('حريق')) return 'مكافحة الحريق';
    if (c.includes('تباليط') || c.includes('تكسية')) return 'الأرضيات والتكسية';
    if (c.includes('مباني')) return 'أعمال المباني';
    
    if (c.length === 0) return 'عام';
    return c;
}

function cleanUnit(unit) {
    if (!unit) return 'غير محدد';
    const u = unit.toLowerCase().trim();
    if (u === 'm2') return 'متر مربع';
    if (u === 'm1') return 'متر طولي';
    if (u === 'fixed') return 'مقطوعية';
    if (u === 'unit' || u === 'units') return 'عدد';
    return unit;
}

function cleanAction(action) {
    if (!action) return 'عام';
    let a = action.trim();
    if (a === 'other') return 'عام';
    if (a === 'صيانه') return 'صيانة';
    if (a === 'توريد و تركيب') return 'توريد وتركيب';
    if (a === 'توريد وتغير') return 'توريد وتغيير';
    return a;
}

function generateTitle(item) {
    if (!item) return 'بند غير مسمى';
    const words = item.trim().split(/\s+/);
    return words.slice(0, 6).join(' '); // first 6 words as title
}

const formattedData = data.map((d, index) => {
    const rawCategory = d.category || 'عام';
    const category = cleanCategory(rawCategory);
    const unit = cleanUnit(d.unit);
    const action = cleanAction(d.action);
    const title = generateTitle(d.item);
    
    const price = d.price ? parseFloat(d.price) : 0;
    
    return {
        id: index + 1, // Sequential ID
        title: title,
        description: d.item || '',
        category: category,
        sub_category: "عام", // Can be updated later
        unit: unit,
        estimated_price: isNaN(price) ? 0 : price,
        currency: "EGP",
        image_urls: [],
        tags: [category.split(' ')[0], action].filter(t => t && t !== 'عام'), // basic tags
        action: action,
        source: d.source || 'system'
    };
});

fs.writeFileSync(filePath, JSON.stringify(formattedData, null, 4));
console.log(`✅ Successfully formatted ${formattedData.length} items!`);
