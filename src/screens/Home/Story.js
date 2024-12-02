import React from 'react';
import {FlatList, Image, View} from 'react-native';
import Text from '../../components/Text';
import {images} from '../../assets/images';
import {nh, nw} from '../../helper/scales';

export const Story = () => {
  // render
  return (
    <View>
      <Text variant="semibold16" style={{paddingLeft: nw(16)}}>
        Announcements
      </Text>
      <View style={{height: nh(70)}}>
        <FlatList
          data={['', '', '', '', '', '', '', '', '', '', '', '', '', '']}
          horizontal
          contentContainerStyle={{paddingLeft: nw(16), marginTop: nh(15)}}
          showsHorizontalScrollIndicator={false}
          renderItem={({}) => {
            return (
              <Image
                source={images.ciclelogo}
                style={{
                  height: nh(50),
                  width: nw(50),
                }}
                resizeMode="contain"
              />
            );
          }}
        />
      </View>
    </View>
  );
};
