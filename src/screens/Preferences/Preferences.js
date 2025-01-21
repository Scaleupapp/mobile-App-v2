import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import Text from '../../components/Text';
import {images} from '../../assets/images';
import Button from '../../components/Button';
import CustomTextInput from '../../components/TextInput';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import Routes from '../../helper/routes';
import {getPreferences, savePreferences} from '../../services/apiService';
import {TouchableWithoutFeedback} from 'react-native';
import {ScrollView} from 'react-native';
const Preferences = ({navigation, route}) => {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [words, setWords] = useState([]);

  const handleAddWord = () => {
    if (input.trim()) {
      setWords([...words, input.trim()]);
      setInput(''); // Clear the input
    }
  };
  const handleRemoveWord = index => {
    const updatedWords = words.filter((_, i) => i !== index);
    setWords(updatedWords);
  };

  useEffect(() => {
    getPreference();
  }, []);

  const getPreference = async () => {
    try {
      let res = await getPreferences();
      console.log(res?.data?.prefrenceInfo, 'ididn');
      if (Object.keys(res?.data?.prefrenceInfo).length > 0) {
        console.log('isndie');
        let userAnswers = res?.data?.prefrenceInfo;
        const updatedQuestions = questions.map(question => {
          if (question.id === 1) {
            return {...question, answer: userAnswers.learningGoals};
          } else if (question.id === 2) {
            return {...question, answer: userAnswers.preferedWay};
          } else if (question.id === 3) {
            setWords(userAnswers.topicsOfInterest);
            return {...question, answer: userAnswers.topicsOfInterest};
          }
          return question; // Return unchanged question if no match
        });

        setQuestions(updatedQuestions);
      }
    } catch (error) {}
  };
  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: 'checkbox',
      image: images.preference1,
      title: 'What Are Your Learning Goals?',
      width: 191,
      subtitle:
        'Select your top learning priorities so we can tailor your experience.',
      options: [
        {title: 'Skill Development', maintitle: ''},
        {title: 'Academic Improvement', maintitle: ''},
        {title: 'Career Advancement', maintitle: ''},
        {title: 'Personal Growth', maintitle: ''},
        {title: 'Hobby and Creativity', maintitle: ''},
      ],
      answer: [], // To store selected options
    },
    {
      id: 2,
      type: 'checkbox',
      title: 'How Do You Prefer to Learn?',
      image: images.preference2,
      width: 186,
      subtitle:
        'Choose your preferred learning formats so we can personalize your content.',
      options: [
        {title: 'Videos, Infographics', maintitle: 'Visual: '},
        {title: 'Articles, eBooks', maintitle: 'Reading: '},
        {title: 'Podcasts, Audio Lectures', maintitle: 'Auditory: '},
        {title: 'Quizzes, Hands-on Projects', maintitle: 'Interactive: '},
        {
          title: 'Group Discussions, Peer Learning',
          maintitle: 'Collaborative: ',
        },
      ],
      answer: [], // To store selected options
    },
    {
      id: 3,
      type: 'textinput',
      title: 'What Topics Interest You?',
      image: images.preference3,
      width: 275,
      subtitle:
        'Add all the subjects you’re passionate about to help us recommend the best content.\n(Press enter after each topic)',
      options: [],
      answer: [], // To store selected options
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Handle checkbox selection
  const handleCheckboxChange = optionTitle => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[currentQuestionIndex];

    if (currentQuestion.answer.includes(optionTitle)) {
      // Remove option if already selected
      currentQuestion.answer = currentQuestion.answer.filter(
        item => item !== optionTitle,
      );
    } else {
      // Add option if not selected
      currentQuestion.answer.push(optionTitle);
    }

    setQuestions(updatedQuestions); // Update state
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log(questions, 'questions');
      const params = {
        learningGoals: questions[0]?.answer,
        preferedWay: questions[1]?.answer,
        topicsOfInterest: words,
      };
      console.log(params);
      try {
        const {data} = await savePreferences(params);

        console.log(data, 'data from preference');
        navigation.reset({
          index: 0,
          routes: [{name: Routes.Home}],
        });
      } catch (error) {
        console.log('🚀 ~ handleNext ~ error:', error);
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const menuItems = [
    {id: 1, name: 'Settings', icon: 'settings-sharp'},
    {id: 5, name: 'Restore Defaults', icon: 'Restore Defaults'},
    {id: 3, name: 'Notifications', icon: 'notifications'},
    {id: 4, name: 'Profile', icon: 'person'},

    {id: 5, name: 'Help Centre', icon: 'help-circle'},
  ];

  // Render item for FlatList
  const renderMenuItem = ({item}) => (
    <TouchableOpacity
      onPress={() => alert(`${item.name} clicked`)}
      style={{flexDirection: 'row', marginBottom: nh(15)}}>
      <Icon
        name={item.icon}
        size={19}
        color={COLORS.grey999999}
        style={{marginRight: 7}}
      />
      <Text variant="medium12">{item.name}</Text>
    </TouchableOpacity>
  );
  const bottomComp = param => {
    return (
      <View
        style={{
          //   flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: DEVICE_WIDTH - 36,
          marginTop: nh(10),
        }}>
        <Button
          width={nw(63)}
          height={nh(35)}
          textStyle={{fontSize: 14}}
          text={currentQuestionIndex < questions.length - 1 ? 'Next' : 'Done'}
          onPress={handleNext}
        />
        <Text variant="medium12" color={COLORS.grey999999}>
          Choice {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Dismiss Keyboard when tapping outside */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}>
          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled">
            {/* Your Header */}
            <Header
              title="Preferences"
              onBackPress={() => navigation.goBack()}
              onRightIconPress={() => setVisible(true)}
            />

            {/* Rest of the content */}
            <View style={styles.layer1}>
              <View style={styles.layer2}>
                <Image
                  source={currentQuestion.image}
                  style={[styles.image, {width: nw(currentQuestion.width)}]}
                />

                <Text variant="semibold14" color={COLORS.yellowF5BE00}>
                  {currentQuestion.title}
                </Text>
                <Text
                  variant="medium12"
                  color={COLORS.grey999999}
                  style={{marginBottom: nh(15)}}>
                  {currentQuestion.subtitle}
                </Text>

                {/* Handle Checkboxes */}
                {currentQuestion.type === 'checkbox' && (
                  <FlatList
                    data={currentQuestion.options}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={styles.optionContainer}
                        onPress={() => handleCheckboxChange(item.title)}>
                        <View
                          style={[
                            styles.checkbox,
                            currentQuestion.answer.includes(item.title) &&
                              styles.checkboxSelected,
                          ]}>
                          {currentQuestion.answer.includes(item.title) && (
                            <Text style={styles.checkboxTick}>✔</Text>
                          )}
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text variant="semibold12" color={COLORS.grey999999}>
                            {item.maintitle}
                          </Text>
                          <Text variant="medium12" color={COLORS.grey999999}>
                            {item.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => `${item.title}-${index}`}
                    ListFooterComponent={bottomComp}
                    keyboardShouldPersistTaps="handled"
                  />
                )}

                {/* Handle Text Input */}
                {currentQuestion.type === 'textinput' && (
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginBottom: 10,
                      }}>
                      {words.map((item, index) => (
                        <View
                          key={index.toString()}
                          style={{
                            padding: 10,
                            margin: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <Text variant="semibold12">{item}</Text>
                          <TouchableOpacity
                            style={styles.crossButton}
                            onPress={() => handleRemoveWord(index)}>
                            <Text style={styles.crossText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    <CustomTextInput
                      placeholder="Please specify"
                      errorMessage=""
                      value={input}
                      onChangeText={setInput}
                      onSubmitEditing={handleAddWord}
                    />

                    {bottomComp()}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default Preferences;

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
  contentContainer: {
    paddingTop: nh(30),
    paddingBottom: nh(40), // Add padding at the bottom for better scrolling
  },

  checkboxSelected: {
    borderColor: '#007BFF',
    backgroundColor: '#E6F0FF',
  },

  image: {
    height: nh(179),
    alignSelf: 'center',
    marginBottom: nh(30),
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    // alignItems: 'flex-start',
    marginBottom: nh(10),
  },
  checkbox: {
    width: nw(18),
    height: nh(18),
    borderWidth: 1,
    borderColor: COLORS.grey999999,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(7),
  },
  checkboxSelected: {
    borderColor: 'black',
  },
  checkboxTick: {
    color: 'black',
    fontSize: nh(12),
    marginTop: -2,
  },
  optionTextContainer: {
    // flex: 1,
    flexDirection: 'row',
  },
  crossButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f5be00',
    borderRadius: 12,
    width: 20,
    height: 20,
  },
});
