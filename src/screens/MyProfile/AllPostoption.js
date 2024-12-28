import React, {useState} from 'react';
import {View} from 'react-native';
import ToggleWithIconUnderline from '../../components/TogglewithIconUnderline';
import {AllPost} from '../../components/AllPost';
import {Verified} from './VerfiedPost';
import {VideoList} from './VideoList';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import {nh} from '../../helper/scales';

const AllPostoption = ({type, data}) => {
  const [selected, setSelected] = useState(0);
  const onToggle = index => {
    setSelected(index);
  };
  return (
    <View>
      {type == 'user' ? (
        <>
          <ToggleWithIconUnderline onToggle={onToggle} />

          {selected == 0 && <AllPost data={data} />}
          {selected == 1 && <AllPost />}
          {selected == 2 && <AllPost />}
          {/* {selected == 3 && <Verified />}
          {selected == 4 && <Verified />}
          {selected == 5 && <Verified />} */}
          {selected == 3 && <VideoList />}
        </>
      ) : (
        <View style={{marginTop: nh(30)}}>
          <View style={{marginBottom: nh(30)}}>
            <ToggleWithUnderline
              options={['ALL POSTS', 'PLAYLISTS']}
              onToggle={onToggle}
            />
          </View>
          {selected == 0 && <AllPost data={data} />}
          {selected == 1 && <VideoList />}
        </View>
      )}
    </View>
  );
};

export default AllPostoption;
