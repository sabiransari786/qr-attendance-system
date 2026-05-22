(async () => {
  try {
    const { pool } = require('../src/config');

    // Mapping of course code -> semester (canonical codes without non-alphanum)
    const mapping = {
      'DCOS101':1,'DCOM102':1,'DEE103':1,'DME104':1,'DCO105':1,'DEE113':1,'DME116':1,'DME117':1,'DCO115':1,
      'DCOM201':2,'DCOP202':2,'DEL203':2,'DCOC204':2,'DCO205':2,'DCOP212':2,'DEL213':2,'DCOC214':2,'DCO215':2,
      'DCO301':3,'DCO302':3,'DEE303':3,'DCO304':3,'DEL306':3,'DCO312':3,'DCO314':3,'DCO315':3,'DEL316':3,
      'DCOS401':4,'DCO402':4,'DCO403':4,'DCO404':4,'DEL405':4,'DCO412':4,'DCO413':4,'DCO414':4,'DEL415':4,
      'DCO501':5,'DCO502':5,'DCO503':5,'DCO504':5,'DCO505':5,'DCO511':5,'DCO512':5,'DCO513':5,'DCO515':5,'DCO520':5,
      'DCO601':6,'DCO602':6,'DCO603':6,'DCO604':6,'DCO605':6,'DCO606':6,'DCO608':6,'DCO611':6,'DCO612':6,'DCO620':6,'DCO630':6
    };

    let updated = 0;
    for (const [code, sem] of Object.entries(mapping)) {
      const [res] = await pool.query(`UPDATE courses SET semester = ? WHERE UPPER(REPLACE(code, '-', '')) = ? AND (semester IS NULL OR semester = 0)`, [sem, code]);
      if (res && res.affectedRows > 0) {
        updated += res.affectedRows;
        console.log(`Updated ${res.affectedRows} row(s) for code ${code} -> semester ${sem}`);
      }
    }

    const [remaining] = await pool.query(`SELECT COUNT(*) AS cnt FROM courses WHERE semester IS NULL OR semester = 0`);
    console.log(`Total updated: ${updated}. Remaining without semester: ${remaining[0].cnt}`);
    process.exit(0);
  } catch (err) {
    console.error('Error setting semesters:', err.message || err);
    process.exit(1);
  }
})();
