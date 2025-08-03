#!/usr/bin/env node

// Test script for YouTube API integration
require('dotenv').config();
const { fetchVideosFromYoutube, getVideoDetails, getChannelDetails } = require('./utils/youtube');

async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API integration...\n');

  // Test 1: Fetch trending videos
  console.log('1. Testing trending videos...');
  try {
    const trendingVideos = await fetchVideosFromYoutube('trending', 5);
    console.log(`✅ Fetched ${trendingVideos.length} trending videos`);
    if (trendingVideos.length > 0) {
      console.log(`   Sample: "${trendingVideos[0].title}"`);
    }
  } catch (error) {
    console.error('❌ Error fetching trending videos:', error.message);
  }

  console.log('');

  // Test 2: Search for videos
  console.log('2. Testing video search...');
  try {
    const searchResults = await fetchVideosFromYoutube('javascript tutorial', 3);
    console.log(`✅ Found ${searchResults.length} videos for "javascript tutorial"`);
    if (searchResults.length > 0) {
      console.log(`   Sample: "${searchResults[0].title}"`);
    }
  } catch (error) {
    console.error('❌ Error searching videos:', error.message);
  }

  console.log('');

  // Test 3: Get specific video details
  console.log('3. Testing video details...');
  try {
    const videoDetails = await getVideoDetails('dQw4w9WgXcQ'); // Rick Roll video ID
    console.log(`✅ Fetched details for video`);
    if (videoDetails.length > 0) {
      console.log(`   Title: "${videoDetails[0].title}"`);
      console.log(`   Views: ${videoDetails[0].viewCount}`);
    }
  } catch (error) {
    console.error('❌ Error fetching video details:', error.message);
  }

  console.log('');

  // Test 4: Get channel details
  console.log('4. Testing channel details...');
  try {
    const channelDetails = await getChannelDetails('UC_x5XG1OV2P6uZZ5FSM9Ttw'); // Google for Developers
    console.log(`✅ Fetched channel details`);
    if (channelDetails) {
      console.log(`   Channel: "${channelDetails.snippet.title}"`);
      console.log(`   Subscribers: ${channelDetails.statistics.subscriberCount}`);
    }
  } catch (error) {
    console.error('❌ Error fetching channel details:', error.message);
  }

  console.log('\n🎉 YouTube API test completed!');
}

// Run the test
testYouTubeAPI().catch(console.error);
