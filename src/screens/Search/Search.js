//@ts-nocheck
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  FlatList,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {
  followUser,
  globalSearch,
  unlfollowUser,
} from '../../services/apiService';
import {COLORS} from '../../helper/colors';
import CustomTextInput from '../../components/TextInput';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {icons} from '../../assets/icons';
import Text from '../../components/Text';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';
import {debounce} from '../../helper/commonFunctions';

const Search = () => {
  const dispatch = useDispatch();
  const {showToast} = useToast();
  const [data, setData] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (text.length > 1) {
      const data = {query: text};
      console.log('🚀 ~ useEffect ~ data:', data);
      globalSearch(data)
        .then(res => {
          setData(res?.data);
        })
        .catch(err => console.log('errr ', err));
    } else {
      setData([]);
    }
  }, [text]);

  const handleInputChange = useCallback(
    debounce(val => {
      setText(val);
      console.log('Debounced Input:', val);
    }, 500),
    [],
  );

  const setUserData = item => {
    navigationRef.navigate(Routes.MyProfile, {
      type: 'other',
      id: item,
    });
  };

  const followThisUser = item => {
    if (item?.isFollowing) {
      unlfollowUser(item?.userId).then(res => {
        showToast({type: 'success', title: res?.data?.message});
        const data = {query: text};
        globalSearch(data).then(res => {
          setData(res?.data);
        });
      });
    } else {
      followUser(item?.userId).then(res => {
        showToast({type: 'success', title: res?.data?.message});
        const data = {query: text};
        globalSearch(data).then(res => {
          setData(res?.data);
        });
      });
    }
  };

  const renderItem_didNumber = ({item, index}) => {
    // console.log(item, "value---->")
    return (
      <TouchableOpacity
        onPress={() => {
          setUserData(item?.userId);
        }}
        style={[
          styles.postStyle,
          {marginTop: 10, marginBottom: data?.length - 1 == index ? 50 : 0},
        ]}>
        <TouchableOpacity
          style={styles.info}
          onPress={() => {
            setUserData(item?.userId);
          }}>
          <View
            style={{flexDirection: 'row', alignItems: 'center', width: '55%'}}>
            {item?.profilePicture ? (
              <Image
                resizeMode="cover"
                style={styles.profileImg}
                source={{uri: item?.profilePicture}}
              />
            ) : (
              <View
                style={[
                  styles.profileImg,
                  {alignItems: 'center', justifyContent: 'center'},
                ]}>
                <Text variant="semibold20" color={COLORS.black333333}>
                  {`${item?.firstname?.charAt(0).toUpperCase()}${item?.lastname
                    ?.charAt(0)
                    .toUpperCase()}`}
                </Text>
              </View>
            )}
            <View style={styles.nameType}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text variant="semibold14" color={COLORS.black333333}>
                  {item?.username}
                </Text>
                {item?.role === 'SME' && (
                  <Image
                    resizeMode="contain"
                    tintColor={'#F6BE00'}
                    source={require('../../assets/icons/medal-star.png')}
                    style={{height: 18, width: 18, marginLeft: 5}}
                  />
                )}
              </View>
              <Text
                color={COLORS.black333333}
                numberOfLines={1}
                variant="semibold12">
                {item?.firstname + ' ' + item?.lastname}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  followThisUser(item);
                }}>
                <ImageBackground
                  style={styles.color}
                  source={require('../../assets/icons/button_.png')}>
                  <Text color={COLORS.yellowF5BE00} variant="medium12">
                    {item?.isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '45%',
            }}>
            <TouchableOpacity
              onPress={() => {
                setUserData(item?.userId);
              }}
              style={{alignItems: 'center'}}>
              <Text color={COLORS.black333333} variant="medium12">
                {item?.totalPosts}
              </Text>
              <Text color={COLORS.black333333} variant="medium12">
                {'posts'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{alignItems: 'center'}}
              onPress={() => {
                setUserData(item?.userId);
              }}>
              <Text color={COLORS.black333333} variant="medium12">
                {item?.followersCount}
              </Text>
              <Text color={COLORS.black333333} variant="medium12">
                {'followers'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{alignItems: 'center'}}
              onPress={() => {
                setUserData(item?.userId);
              }}>
              <Text color={COLORS.black333333} variant="medium12">
                {item?.followingCount}
              </Text>
              <Text color={COLORS.black333333} variant="medium12">
                {'following'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={styles.main}>
      <Header backgroundColor={COLORS.whiteFFFFFF} backIcon={icons.backDark} />

      <View
        style={{
          alignItems: 'center',
          marginTop: nh(30),
        }}>
        <CustomTextInput
          placeholder="Search"
          width={DEVICE_WIDTH - 32}
          //   value={text}
          //   onChangeText={setText}
          onChangeText={handleInputChange}
        />
      </View>

      <View style={[styles.reelsStyle]}>
        <FlatList
          scrollEnabled
          showsVerticalScrollIndicator={false}
          data={data}
          renderItem={renderItem_didNumber}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text
                style={{
                  color: COLORS.gray_color,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '500',
                }}>
                {'No Search Results'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  reelsStyle: {
    flex: 1,
    margin: 12,
  },
  postStyle: {
    // height: 300,
    width: '100%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 15,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileImg: {
    height: nw(56),
    width: nw(56),
    borderRadius: nw(28),
    backgroundColor: COLORS.greyD6D6D6,
  },
  nameType: {
    paddingLeft: 10,
    width: '70%',
  },
  color: {
    height: nh(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: nw(25),
    width: nw(65),
    marginTop: nh(4),
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});

export default Search;
