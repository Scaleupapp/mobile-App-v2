import React from 'react';
import {FlatList, View, Text, StyleSheet, Dimensions} from 'react-native';

import {VideoCard} from '../../components/VideoCard';
import Button from '../../components/Button';
import {nh} from '../../helper/scales';
import CustomTextInput from '../../components/TextInput';
import {COLORS} from '../../helper/colors';

const data = [
  // {
  //   id: '1',
  //   title: 'UI/UX Design',
  //   description: 'Public',
  //   posted: '8 vidoes',
  // },
  // {
  //   id: '2',
  //   title: 'UI/UX Design',
  //   description: 'Public',
  //   posted: '8 vidoes',
  // },
  // {
  //   id: '3',
  //   title: 'UI/UX Design',
  //   description: 'Public',
  //   posted: '8 vidoes',
  // },
  // {
  //   id: '4',
  //   title: 'UI/UX Design',
  //   description: 'Public',
  //   posted: '8 vidoes',
  // },
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
      {/* <CustomTextInput height={50} /> */}
      <FlatList
        data={data}
        contentContainerStyle={{marginVertical: 30}}
        renderItem={({item}) => (
          <VideoCard item={item} fullpage={fullpage} tick={tick} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{'No content available'}</Text>
          </View>
        )}
      />
      {/* <Button text="Create New Playlists" /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyText: {
    color: COLORS.grey999999,
    fontSize: 16,
  },
});
