import React from 'react';
import {FlatList, View, Text, StyleSheet, Dimensions} from 'react-native';
import {COLORS} from '../helper/colors';
import {nh, nw} from '../helper/scales';

const data = [
  {id: '1', title: 'Card 1', height: 120},
  {id: '2', title: 'Card 2', height: 180},
  {id: '3', title: 'Card 3', height: 150},
  {id: '4', title: 'Card 4', height: 200},
  {id: '5', title: 'Card 5', height: 100},
  {id: '6', title: 'Card 6', height: 170},
];

const {width} = Dimensions.get('window');

const CARD_WIDTH = nw(163); // Two columns with margins

export const AllPost = () => {
  const leftColumnData = data.filter((_, index) => index % 2 === 0); // Items for left column
  const rightColumnData = data.filter((_, index) => index % 2 !== 0); // Items for right column

  const renderColumn = columnData => (
    <View style={styles.column}>
      {columnData.map(item => (
        <View key={item.id} style={[styles.card, {height: item.height}]}>
          <Text style={styles.cardText}>{item.title}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderColumn(leftColumnData)}
      {renderColumn(rightColumnData)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.grey999999,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(16),
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
