# Automatic seeding for typeorm postgres

## Try it out

1. Set up a postgres database and point the typeorm.ts file to it
2. Run the migrations with `npx typeorm migration:run -d dist/typeorm.js`
3. Build with `npm run build`
4. Seed the db with `npm run seed`

## How it works

Given a root db entity acquired via `dataSource.entityMetadatas`, the seeder algorithm will 
iterate over the columns of the db. If the column has a recognized type, then an instance 
of that type will be generated. If the type is not recognized, then the algorithm will 
assign a `null` value. If the column has a referenced entity (ie. represents a relationship 
with another entity), then an instance of the dependency is generated recursively. The fk data 
is inferred from the recursively generated entities. 

Based on this algorithm, in the event that an entity has multiple dependencies on the same table
(as in the example in this repo), an independent record will be created for each relationship.

