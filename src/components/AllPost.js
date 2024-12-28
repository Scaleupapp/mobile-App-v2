import React, {useEffect, useState} from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {Image} from 'react-native';
import Icon from '../helper/icon';
import Video from 'react-native-video';

// const data = [
//   {id: '1', title: 'Card 1', height: 120},
//   {id: '2', title: 'Card 2', height: 180},
//   {id: '3', title: 'Card 3', height: 150},
//   {id: '4', title: 'Card 4', height: 200},
//   {id: '5', title: 'Card 5', height: 100},
//   {id: '6', title: 'Card 6', height: 170},
// ];

const {width} = Dimensions.get('window');

const CARD_WIDTH = nw(163); // Two columns with margins

export const AllPost = ({}) => {
  let data = [
    {
      _id: '675e87e80fc347ee5b0665bb',
      username: 'rohit kumar',
      captions: 'Kckckvl',
      hashtags: ['#jcicic'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/675b2be1faab6e2a6c8ca44e/Ifif_1734211576069/IMG_20241111_092538.jpg',
      heading: 'Ifif',
      relatedTopics: ['Uducud'],
      userId: {
        _id: '674ed1e392383a88cabf2bb2',
        username: 'scaleup1234',
        isTestUser: true,
        profilePicture:
          'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/674ed1e392383a88cabf2bb2/profile-picture.jpg',
      },
      likes: ['674ed1e392383a88cabf2bb2'],
      comments: [],
      contentType: 'Image',
      viewCount: 0,
      smeVerify: 'Pending',
      postdate: '2024-12-14T21:26:18.275Z',
      isLiked: true,
      isSaved: false,
      isVerified: false,
    },
    {
      _id: '67558e2dcddd3cef28f2ff5f',
      username: 'nirpeksh',
      captions: 'Tsting',
      hashtags: ['#startup', '#scaleup'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/Testing_1733660204669/112.png',
      heading: 'Testing',
      relatedTopics: ['Startup', 'Learning'],
      userId: {
        _id: '65dc66dd55fd97c98892ba2d',
        username: 'nirpeksh',
        profilePicture:
          'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/profile-picture.jpg',
        isTestUser: false,
      },
      likes: [],
      comments: [],
      contentType: 'Image',
      viewCount: 0,
      smeVerify: 'Accepted',
      postdate: '2024-12-08T12:16:45.940Z',
      isLiked: false,
      isSaved: true,
      isVerified: true,
    },
    {
      _id: '6754ccedcddd3cef28f2ff53',
      username: 'nirpeksh',
      captions: 'Tsting',
      hashtags: ['#startup', '#scaleup'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/Testing_1733610732692/112.png',
      heading: 'Testing',
      relatedTopics: ['Startup', 'Learning'],
      userId: {
        _id: '65dc66dd55fd97c98892ba2d',
        username: 'nirpeksh',
        profilePicture:
          'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/profile-picture.jpg',
        isTestUser: false,
      },
      likes: [],
      comments: [],
      contentType: 'Image',
      viewCount: 0,
      smeVerify: 'Accepted',
      postdate: '2024-12-07T22:32:13.939Z',
      isLiked: false,
      isSaved: true,
      isVerified: true,
    },
    {
      _id: '6754cbe7cddd3cef28f2ff47',
      username: 'nirpeksh',
      captions: 'Tsting',
      hashtags: ['#startup', '#scaleup'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/Testing_1733610469971/WhatsApp%20Image%202024-10-11%20at%2017.20.02_6bcd80e3.jpg',
      heading: 'Testing',
      relatedTopics: ['Startup', 'Learning'],
      userId: {
        _id: '65dc66dd55fd97c98892ba2d',
        username: 'nirpeksh',
        profilePicture:
          'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/profile-picture.jpg',
        isTestUser: false,
      },
      likes: [],
      comments: [],
      contentType: 'Image',
      viewCount: 0,
      smeVerify: 'Accepted',
      postdate: '2024-12-07T22:27:51.199Z',
      isLiked: false,
      isSaved: false,
      isVerified: true,
    },
    {
      _id: '6754b6eecddd3cef28f2ff3b',
      username: 'nirpeksh',
      captions: 'Tsting',
      hashtags: ['#startup', '#scaleup'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/Testing_1733605099667/1.mp4',
      heading: 'Testing',
      relatedTopics: ['Startup', 'Learning'],
      userId: {
        _id: '65dc66dd55fd97c98892ba2d',
        username: 'nirpeksh',
        profilePicture:
          'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/profile-picture.jpg',
        isTestUser: false,
      },
      likes: ['674ed1e392383a88cabf2bb2'],
      comments: [],
      contentType: 'Image',
      viewCount: 0,
      smeVerify: 'Accepted',
      postdate: '2024-12-07T20:58:22.733Z',
      isLiked: true,
      isSaved: false,
      isVerified: true,
    },
    {
      _id: '66d82ca3fb74092bfbba8965',
      username: 'aditya2653',
      captions: 'Ratios test is a common concept used to deal with factorials.',
      hashtags: ['Maths', 'Factorials'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/663a0e802693d884adf471b5/Maths_1725443231334/video.mp4',
      heading: 'Maths',
      relatedTopics: ['What is a ratio test?'],
      userId: {
        _id: '663a0e802693d884adf471b5',
        username: 'aditya2653',
        isTestUser: false,
      },
      likes: ['676042a43c4f563594079a85', '675b2be1faab6e2a6c8ca44e'],
      comments: [],
      contentType: 'Video',
      viewCount: 0,
      smeVerify: 'NA',
      postdate: '2024-09-04T09:47:15.845Z',
      isLiked: false,
      isSaved: false,
      isVerified: false,
    },
    {
      _id: '66d82b1dfb74092bfbba8834',
      username: 'aditya2653',
      captions:
        'A litmus test is used in chemistry to determine if a solution is acidic or basic using litmus or litmus paper. Litmus comes from certain species of lichens. Litmus will turn blue when exposed to a base and red when exposed to an acid.',
      hashtags: ['Chemistry Litmus'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/663a0e802693d884adf471b5/Chemistry+_1725442839939/video.mp4',
      heading: 'Chemistry ',
      relatedTopics: ['How is Litmus Test Done?'],
      userId: {
        _id: '663a0e802693d884adf471b5',
        username: 'aditya2653',
        isTestUser: false,
      },
      likes: ['675b2be1faab6e2a6c8ca44e'],
      comments: [
        {
          _id: '67670940a1a267d0bdc2da7c',
          contentId: '66d82b1dfb74092bfbba8834',
          userId: {
            _id: '675b2be1faab6e2a6c8ca44e',
            username: 'rohit kumar',
            profilePicture:
              'https://lh3.googleusercontent.com/a/ACg8ocKzzZ5VBujPUimHSqwDv_iUMwleIXIomeRheypusZ9KKAPgazI=s96-c',
          },
          username: 'rohit kumar',
          commentText: 'Litmus',
          parentCommentId: null,
          replies: [],
          likes: [],
          likeCount: 0,
          commentDate: '2024-12-21T18:30:24.236Z',
          __v: 0,
          isLiked: false,
        },
        {
          _id: '67670944a1a267d0bdc2da83',
          contentId: '66d82b1dfb74092bfbba8834',
          userId: {
            _id: '675b2be1faab6e2a6c8ca44e',
            username: 'rohit kumar',
            profilePicture:
              'https://lh3.googleusercontent.com/a/ACg8ocKzzZ5VBujPUimHSqwDv_iUMwleIXIomeRheypusZ9KKAPgazI=s96-c',
          },
          username: 'rohit kumar',
          commentText: '',
          parentCommentId: null,
          replies: [],
          likes: [],
          likeCount: 0,
          commentDate: '2024-12-21T18:30:28.099Z',
          __v: 0,
          isLiked: false,
        },
      ],
      contentType: 'Video',
      viewCount: 0,
      smeVerify: 'NA',
      postdate: '2024-09-04T09:40:45.804Z',
      isLiked: false,
      isSaved: false,
      isVerified: false,
    },
    {
      _id: '66d8287efb74092bfbba87b3',
      username: 'aditya2653',
      captions: 'Here we study how do we interpret motion data',
      hashtags: ['Physics', 'motion data'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/663a0e802693d884adf471b5/Physics+_1725442169807/video.mp4',
      heading: 'Physics ',
      relatedTopics: ['Interpreting Motion Data Points'],
      userId: {
        _id: '663a0e802693d884adf471b5',
        username: 'aditya2653',
        isTestUser: false,
      },
      likes: ['675b2be1faab6e2a6c8ca44e'],
      comments: [
        {
          _id: '67670876a1a267d0bdc2d175',
          contentId: '66d8287efb74092bfbba87b3',
          userId: {
            _id: '675b2be1faab6e2a6c8ca44e',
            username: 'rohit kumar',
            profilePicture:
              'https://lh3.googleusercontent.com/a/ACg8ocKzzZ5VBujPUimHSqwDv_iUMwleIXIomeRheypusZ9KKAPgazI=s96-c',
          },
          username: 'rohit kumar',
          commentText: 'Fuvji',
          parentCommentId: null,
          replies: [],
          likes: [],
          likeCount: 0,
          commentDate: '2024-12-21T18:27:02.801Z',
          __v: 0,
          isLiked: false,
        },
        {
          _id: '67670879a1a267d0bdc2d17c',
          contentId: '66d8287efb74092bfbba87b3',
          userId: {
            _id: '675b2be1faab6e2a6c8ca44e',
            username: 'rohit kumar',
            profilePicture:
              'https://lh3.googleusercontent.com/a/ACg8ocKzzZ5VBujPUimHSqwDv_iUMwleIXIomeRheypusZ9KKAPgazI=s96-c',
          },
          username: 'rohit kumar',
          commentText: 'Fuvji',
          parentCommentId: null,
          replies: [],
          likes: [],
          likeCount: 0,
          commentDate: '2024-12-21T18:27:05.631Z',
          __v: 0,
          isLiked: false,
        },
      ],
      contentType: 'Video',
      viewCount: 0,
      smeVerify: 'NA',
      postdate: '2024-09-04T09:29:34.389Z',
      isLiked: false,
      isSaved: false,
      isVerified: false,
    },
    {
      _id: '66d82659fb74092bfbba8732',
      username: 'aditya2653',
      captions:
        'A chromosome is a long, thread-like structure made of DNA and associated proteins that carries genetic information. Chromosomes are found in the nucleus of eukaryotic cells and are the means by which genetic information is passed from one generation to the next during reproduction.',
      hashtags: ['Biology', 'Chromosome'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/663a0e802693d884adf471b5/Biology+_1725441620857/video.mp4',
      heading: 'Biology ',
      relatedTopics: ['What is a Chromosome?'],
      userId: {
        _id: '663a0e802693d884adf471b5',
        username: 'aditya2653',
        isTestUser: false,
      },
      likes: [],
      comments: [],
      contentType: 'Video',
      viewCount: 0,
      smeVerify: 'NA',
      postdate: '2024-09-04T09:20:25.209Z',
      isLiked: false,
      isSaved: false,
      isVerified: false,
    },
    {
      _id: '66d18ef4fb74092bfbba8468',
      username: 'aditya2653',
      captions:
        "Momentum is a measure of the motion of an object and is defined as the product of an object's mass and its velocity. It is a vector quantity, meaning it has both magnitude and direction.",
      hashtags: ['Momentum', 'Physics'],
      contentURL:
        'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/663a0e802693d884adf471b5/Physics+_1725009647534/video.mp4',
      heading: 'Physics ',
      relatedTopics: ['What is Momentum?'],
      userId: {
        _id: '663a0e802693d884adf471b5',
        username: 'aditya2653',
        isTestUser: false,
      },
      likes: [],
      comments: [],
      contentType: 'Video',
      viewCount: 0,
      smeVerify: 'NA',
      postdate: '2024-08-30T09:20:52.166Z',
      isLiked: false,
      isSaved: false,
      isVerified: false,
    },
  ];

  const leftColumnData = data?.filter((_, index) => index % 2 === 0); // Items for left column
  const rightColumnData = data?.filter((_, index) => index % 2 !== 0); // Items for right column

  const Postcard = ({item}) => {
    const [imageHeight, setImageHeight] = useState(200);
    const [videoDimensions, setVideoDimensions] = useState({
      width: 0,
      height: 0,
    });
    useEffect(() => {
      if (item?.contentType == 'Image' && item?.contentURL) {
        Image.getSize(item?.contentURL, (width, height) => {
          setImageHeight(height / 6);
        });
      }
    }, [item?.contentType]);
    const onLoad = data => {
      const {width, height} = data.naturalSize;
      setVideoDimensions({width, height});
    };
    return (
      <View>
        {item?.contentType == 'Image' && item?.contentURL ? (
          <Pressable
            // onPress={() => imageModalRef.current?.present()}
            style={{marginVertical: nh(10)}}>
            <Image
              source={{uri: item?.contentURL}}
              style={{
                height: imageHeight,
                width: (DEVICE_WIDTH - nw(60)) / 2,
                backgroundColor: COLORS.whiteFFFFFF,
                marginBottom: nh(6),
                borderRadius: nh(12),
                backgroundColor: 'grey',
              }}
              resizeMode="cover"
            />
          </Pressable>
        ) : null}
        {item?.contentType == 'Video' && item?.contentURL ? (
          <Pressable
            // onPress={() => setIsPlaying(index)}
            style={{
              marginVertical: nh(10),
              // alignContent: 'center',
              // justifyContent: 'center',
            }}>
            {item?.isVerified && (
              <View
                style={{
                  height: nh(30),
                  width: nw(30),
                  borderRadius: 15,
                  backgroundColor: COLORS.blue043142,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  zIndex: 1,
                  // Centers vertically
                }}>
                <Icon
                  type="material-community"
                  name="check-decagram"
                  color={COLORS.yellowF5BE00}
                  size={20} // Ensure the icon size is appropriate
                />
              </View>
            )}
            <Video
              paused={true}
              controls
              onLoad={onLoad}
              // source={{uri: convertToProxyURL(item?.contentURL)}}
              source={{uri: item?.contentURL}}
              style={
                videoDimensions?.height
                  ? {
                      aspectRatio: Number(
                        videoDimensions.width / videoDimensions.height,
                      ),
                      width: (DEVICE_WIDTH - nw(60)) / 2,
                      backgroundColor: COLORS.whiteFFFFFF,
                      marginBottom: nh(6),
                    }
                  : {
                      height: nh(250),
                      width: (DEVICE_WIDTH - nw(60)) / 2,
                      backgroundColor: COLORS.whiteFFFFFF,
                      marginBottom: nh(6),
                    }
              }
              resizeMode="cover"
              onBuffer={e => console.log('bufeer ', e)}
              onError={e => console.log('sdsds ', e)}
            />
            {/* <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
            }}>
            <Icon
              type="antdesign"
              name="playcircleo"
              size={nh(40)}
              color={COLORS.blue043142}
              style={{marginRight: nw(10), opacity: 0.8}}
            />
          </View> */}
          </Pressable>
        ) : null}
      </View>
    );
  };

  const RenderColumn = ({columnData}) => {
    return (
      <View style={styles.column}>
        <FlatList
          data={columnData}
          renderItem={({item}) => <Postcard item={item} />}
        />
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <RenderColumn columnData={leftColumnData} />
      <RenderColumn columnData={rightColumnData} />
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
