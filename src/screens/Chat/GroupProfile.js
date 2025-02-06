import React from 'react';
import {
  View,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Header from '../../components/Header';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Icon from '../../helper/icon';
import Text from '../../components/Text';
import Routes from '../../helper/routes';

// const groupData = {
//   _id: '679e27c9acd699854799acef',
//   name: 'try and find',
//   description: 'Ddddd kasl la ms mmn',
//   groupProfilePicture:
//     'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/65dc66dd55fd97c98892ba2d.jpg',
//   members: [
//     {
//       bio: {bioAbout: 'Founder and CEO, ScaleUp'},
//       _id: '65dc66dd55fd97c98892ba2d',
//       username: 'nirpeksh',
//       role: 'Subject Matter Expert',
//       firstname: 'Nirpeksh',
//       lastname: 'Nandan',
//       profilePicture:
//         'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/65dc66dd55fd97c98892ba2d.jpg',
//     },
//     {
//       bio: {bioAbout: 'Founder and CEO, ScaleUp'},
//       _id: '65dc66dd55fd97c98892ba2d',
//       username: 'nirpeksh',
//       role: 'Subject Matter Expert',
//       firstname: 'Nirpeksh',
//       lastname: 'Nandan',
//       profilePicture:
//         'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/65dc66dd55fd97c98892ba2d/65dc66dd55fd97c98892ba2d.jpg',
//     },
//   ],
//   admins: [
//     {
//       _id: '65dc66dd55fd97c98892ba2d',
//     },
//   ],
//   topics: ['The only', 'The most common'],
//   privacy: 'private',
//   createdDate: '2025-02-01T13:55:21.899Z',
// };

const GroupProfile = ({
  route: {
    params: {groupData, canGoBack = true},
  },
  navigation,
}) => {
  console.log({groupData});
  const handleEditProfile = () => {
    navigation.navigate(Routes.EditGroupProfile, {
      groupData: groupData,
      // groupMembers: selectedMembers,
      groupMembersDetails: groupData?.members,
      edit: true,
    });
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <Header
        onBackPress={() => {
          if (canGoBack) {
            navigation.goBack();
          } else {
            navigation.pop(2);
          }
        }}
        title={'Group Profile'}
        // onRightIconPress={() => setVisible(!visible)}
        // rightIcon={!!route?.params?.id} // show right icon if it's 'other' user
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              {groupData?.profilePicture ? (
                <Image
                  source={{
                    uri: `${
                      groupData?.profilePicture
                    }?timestamp=${new Date().getTime()}`,
                  }}
                  style={styles.groupImage}
                />
              ) : (
                <View
                  style={[
                    styles.groupImage,
                    {
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: COLORS.greyD6D6D6,
                    },
                  ]}>
                  <Icon
                    type="material-community"
                    name="account-group"
                    style={{marginLeft: 0.5}}
                    size={nh(50)}
                  />
                </View>
              )}
              <Text variant="bold20" style={styles.title}>
                {groupData?.name}
              </Text>
              {groupData?.description ? (
                <Text variant="medium14" style={styles.description}>
                  {groupData?.description}
                </Text>
              ) : null}
              <View style={styles.topicsContainer}>
                {groupData?.topics.map((topic, index) => (
                  <Text key={index} style={styles.topicBadge}>
                    {topic}
                  </Text>
                ))}
              </View>
              <Text style={styles.privacy}>Privacy: {groupData?.privacy}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}>
                <Icon
                  //  onPress={onEdit}
                  type={'feather'}
                  // type={'antdesign'}
                  color={COLORS.whiteFFFFFF}
                  name={'edit'}
                  size={nw(15)}
                />
                <Text style={styles.editButtonText}> Edit</Text>
              </TouchableOpacity>
            </View>

            <Text variant="medium16" style={styles.sectionTitle}>
              Members
            </Text>
            <FlatList
              data={groupData?.members.map(member => ({
                ...member,
                isAdmin: groupData?.admins.some(
                  admin => admin?._id === member?._id,
                ),
              }))}
              scrollEnabled={false}
              renderItem={({item}) => <MemberCard member={item} />}
              keyExtractor={(_, index) => index.toString()}
              style={styles.list}
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const MemberCard = ({member}) => {
  return (
    <View style={styles.memberCard}>
      <Image
        source={{uri: member.profilePicture}}
        style={styles.profileImage}
      />
      <View style={styles.memberInfo}>
        <Text variant="medium14" style={styles.memberName}>
          {member?.firstname} {member?.lastname} {member?.isAdmin && '(Admin)'}
        </Text>
        {/* <Text variant="medium12" style={styles.memberRole}>
          {member?.role}
        </Text> */}
        <Text variant="medium12" style={styles.memberRole}>
          {member?.bio?.bioAbout || member?.role}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    color: COLORS.black333333,
  },
  description: {
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  topicsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  topicBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
  },
  privacy: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 8,
    color: COLORS.black333333,
  },
  list: {
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
    height: 80,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#666',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.blue043142,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GroupProfile;
