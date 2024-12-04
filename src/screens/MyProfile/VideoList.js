import React from 'react';
import {FlatList, View, Text, StyleSheet, Dimensions} from 'react-native';

import {VideoCard} from '../../components/VideoCard';
import Button from '../../components/Button';
import {nh} from '../../helper/scales';
import CustomTextInput from '../../components/TextInput';

const data = [
  {
    id: '1',
    title: 'UI/UX Design',
    description: 'Public',
    posted: '8 vidoes',
  },
  {
    id: '2',
    title: 'UI/UX Design',
    description: 'Public',
    posted: '8 vidoes',
  },
  {
    id: '3',
    title: 'UI/UX Design',
    description: 'Public',
    posted: '8 vidoes',
  },
  {
    id: '4',
    title: 'UI/UX Design',
    description: 'Public',
    posted: '8 vidoes',
  },
  //   {
  //     id: '5',
  //     title: 'UI/UX Design',
  //     description: 'Public',
  //     posted: '8 vidoes',
  //   },
];

export const VideoList = ({fullpage, tick}) => {
  return (
    <View style={{marginBottom: nh(30)}}>
      <CustomTextInput height={50} />
      <FlatList
        data={data}
        contentContainerStyle={{marginVertical: 30}}
        renderItem={({item}) => (
          <VideoCard item={item} fullpage={fullpage} tick={tick} />
        )}
      />
      {/* <Button text="Create New Playlists" /> */}
    </View>
  );
};

const styles = StyleSheet.create({});
