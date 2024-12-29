// AllPostoption.js
import React, { useState } from 'react';
import { View } from 'react-native';
import ToggleWithIconUnderline from '../../components/TogglewithIconUnderline';
import SavedPosts from '../Home/SavedPostsModal';
import {AllPost}  from '../../components/AllPost';
import { VideoList } from './VideoList';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import { nh } from '../../helper/scales';

const AllPostoption = ({ type, data }) => {
  const [selected, setSelected] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      {type === 'user' ? (
        <>
          <ToggleWithIconUnderline onToggle={setSelected} />
          {selected === 0 && <AllPost data={data} />}
          {selected === 1 && <SavedPosts />}
          {selected === 2 && <AllPost />}
          {selected === 3 && <VideoList />}
        </>
      ) : (
        <View style={{ marginTop: nh(30), flex: 1 }}>
          <View style={{ marginBottom: nh(30) }}>
            <ToggleWithUnderline
              options={['ALL POSTS', 'PLAYLISTS']}
              onToggle={setSelected}
            />
          </View>
          {selected === 0 && <AllPost data={data} />}
        </View>
      )}
    </View>
  );
};

export default AllPostoption;