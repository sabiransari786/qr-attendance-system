## Railway Database Bootstrap

Railway ka naya MySQL service blank hota hai. Agar aapne naya Railway account ya naya database connect kiya hai, to tables aur data manually import karna hoga.

### 0. One-command clone

Agar aapke paas purane database ke credentials hain, to ye command source se target Railway DB me sab tables aur data copy karegi:

```bash
SOURCE_DB_HOST=old-host \
SOURCE_DB_PORT=3306 \
SOURCE_DB_USER=old-user \
SOURCE_DB_PASSWORD=old-password \
SOURCE_DB_NAME=old-database \
DB_HOST=new-host \
DB_PORT=3306 \
DB_USER=new-user \
DB_PASSWORD=new-password \
DB_NAME=new-database \
npm run db:clone
```

### 1. Schema load karo

```bash
npm run db:bootstrap
```

If you want to run it manually with MySQL CLI instead:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema.sql
```

### 2. Base reference data load karo

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/seed_courses.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/seed_faculty.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/seed_production.sql
```

### 3. Demo data chahiye ho to

```bash
cd backend
node ../database/seed_selected_demo.js
```

### 4. Agar purane Railway database ka exact data chahiye

Pehle old database ka dump export karo:

```bash
mysqldump -h OLD_DB_HOST -u OLD_DB_USER -p OLD_DB_NAME > backup.sql
```

Phir new Railway database me import karo:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < backup.sql
```

### 5. Important note

`schema.sql` tables create karta hai. `seed_*.sql` aur `seed_selected_demo.js` sample/reference data bharte hain. Agar aapko purane Railway account ka exact production data chahiye, to uska dump file zaroori hai; repo us data ko automatically recreate nahi kar sakta.
