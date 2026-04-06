/**
 * MongoDB Index Creation Script
 * 
 * This script creates the required 2dsphere geospatial index
 * on the driver_profiles collection.
 * 
 * Run this script once to fix the $geoNear error.
 */

import { MongoClient } from 'mongodb';

async function createGeoIndex() {
    // Update this connection string to match your MongoDB setup
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/ridexa_db';

    const client = new MongoClient(connectionString);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('driver_profiles');

        // Check existing indexes
        const existingIndexes = await collection.indexes();
        console.log('Existing indexes:', JSON.stringify(existingIndexes, null, 2));

        // Create 2dsphere index on currentLocation
        const result = await collection.createIndex(
            { currentLocation: '2dsphere' },
            { name: 'currentLocation_2dsphere' }
        );

        console.log('✅ Index created successfully:', result);

        // Verify index was created
        const updatedIndexes = await collection.indexes();
        console.log('Updated indexes:', JSON.stringify(updatedIndexes, null, 2));

    } catch (error) {
        console.error('❌ Error creating index:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

createGeoIndex();
