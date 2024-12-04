import React from 'react';
import {FlatList, View, Text, StyleSheet, Dimensions} from 'react-native';
import {COLORS} from '../helper/colors';
import {nh, nw} from '../helper/scales';
import {PostCard} from '../../components/PostCard';

const data = [
  {
    id: '1',
    title: 'Post Headline',
    description: 'Lorem ipsum dolor sit amet, consect...',
    posted: 'Posted on 10th Sep’2024',
    verified: true,
    verifiedon: 'Verified on 15th Sep’2024 ',
  },
  {
    id: '2',
    title: 'Post Headline',
    description: 'Lorem ipsum dolor sit amet, consect...',
    posted: 'Posted on 10th Sep’2024',
    verified: true,
    verifiedon: 'Verified on 15th Sep’2024 ',
  },
  {
    id: '3',
    title: 'Post Headline',
    description: 'Lorem ipsum dolor sit amet, consect...',
    posted: 'Posted on 10th Sep’2024',
    verified: true,
    verifiedon: 'Verified on 15th Sep’2024 ',
  },
  {
    id: '4',
    title: 'Post Headline',
    description: 'Lorem ipsum dolor sit amet, consect...',
    posted: 'Posted on 10th Sep’2024',
    verified: true,
    verifiedon: 'Verified on 15th Sep’2024 ',
  },
  {
    id: '5',
    title: 'Post Headline',
    description: 'Lorem ipsum dolor sit amet, consect...',
    posted: 'Posted on 10th Sep’2024',
    verified: true,
    verifiedon: 'Verified on 15th Sep’2024 ',
  },
];

export const Verified = () => {
  return (
    <View>
      <FlatList data={data} renderItem={({item}) => <PostCard item={item} />} />
    </View>
  );
};

const styles = StyleSheet.create({});
