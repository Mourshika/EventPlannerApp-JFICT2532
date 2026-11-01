import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';


              
const KEY = '@event_planner_events';


              
const C = {
  bg: '#F4F7FC',
  white: '#FFFFFF',
  blue: '#3157D5',
  dark: '#17233D',
  grey: '#718096',
  border: '#E2E8F0',
  red: '#C43D4B',
  green: '#16845B'
};


                        
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});


                                           
const toDate = (d, t) => {
  const [y, m, day] = d.split('-').map(Number);
  const [h, min] = t.split(':').map(Number);

  return new Date(y, m - 1, day, h, min);
};


                                      
const dateString = d => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};


                                 
const timeString = d => {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};


                                   
const pretty = (d, t) => {
  return toDate(d, t).toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


export default function App() {

                    
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);

  const [tab, setTab] = useState('Home');
  const [query, setQuery] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName] = useState('');
  const [date, setDate] = useState(dateString(new Date()));
  const [time, setTime] = useState(timeString(new Date()));
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState('10');

  const [picker, setPicker] = useState('');


                                          
  useEffect(() => {

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);

        if (raw) {
          setEvents(JSON.parse(raw));
        }

      } catch {
        Alert.alert(
          'Storage error',
          'Could not load saved events.'
        );

      } finally {
        setReady(true);
      }
    })();

    setupNotifications();

  }, []);


                                                
  useEffect(() => {

    if (ready) {
      AsyncStorage.setItem(
        KEY,
        JSON.stringify(events)
      ).catch(() => {
        Alert.alert(
          'Storage error',
          'Could not save events.'
        );
      });
    }

  }, [events, ready]);


                                                                              
  async function setupNotifications() {
    try {
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Notifications.requestPermissionsAsync();
      }

      return permission.status === 'granted';
    } catch (error) {
      console.warn('Notification permission is unavailable:', error);
      return false;
    }
  }


                         
  function clearForm() {

    setName('');
    setDate(dateString(new Date()));
    setTime(timeString(new Date()));
    setDescription('');
    setReminder('10');
    setEditing(null);
    setPicker('');

  }


                                        
  function newEvent() {

    clearForm();
    setModal(true);

  }


                                            
  function editEvent(e) {

    setName(e.name);
    setDate(e.date);
    setTime(e.time);
    setDescription(e.description || '');
    setReminder(String(e.reminder));
    setEditing(e.id);

    setModal(true);

  }


                            
  async function save() {

    const n = name.trim();
    const mins = Number(reminder);
    const when = toDate(date, time);


                          
    if (!n) {
      return Alert.alert(
        'Required',
        'Enter an event name.'
      );
    }


                             
    if (!Number.isFinite(when.getTime())) {
      return Alert.alert(
        'Invalid date',
        'Choose a valid date and time.'
      );
    }


                          
    if (when <= new Date()) {
      return Alert.alert(
        'Past event',
        'Choose a future date and time.'
      );
    }


                             
    if (
      !Number.isInteger(mins) ||
      mins < 0 ||
      mins > 10080
    ) {
      return Alert.alert(
        'Invalid reminder',
        'Use 0 to 10080 minutes.'
      );
    }


    const id = editing || String(Date.now());

    const previous = events.find(
      e => e.id === editing
    );


                                                    
    if (previous?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        previous.notificationId
      ).catch(() => {});
    }


                              
    const event = {
      id,
      name: n,
      date,
      time,
      description: description.trim(),
      reminder: mins,
      notificationId: null
    };


                            
    const granted = await setupNotifications();

    if (granted) {

      const trigger = new Date(
        when.getTime() - mins * 60000
      );

      if (trigger > new Date()) {

        try {

          event.notificationId =
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Upcoming event: ${n}`,
                body: event.description || `Starts at ${time}.`,
                data: {
                  eventId: id
                }
              },

              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: trigger,
              }
            });

        } catch {

          Alert.alert(
            'Reminder unavailable',
            'The event can still be saved, but its reminder was not scheduled.'
          );

        }
      }
    }


                              
    setEvents(old =>
      editing
        ? old.map(e => e.id === editing ? event : e)
        : [...old, event]
    );

    setModal(false);
    clearForm();

  }


                    
  function remove(e) {

    Alert.alert(
      'Delete event?',
      `Delete "${e.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {

            if (e.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(
                e.notificationId
              ).catch(() => {});
            }

            setEvents(old =>
              old.filter(x => x.id !== e.id)
            );

          }
        }
      ]
    );

  }


                                 
  const ordered = useMemo(() => {

    return [...events].sort(
      (a, b) =>
        toDate(a.date, a.time) -
        toDate(b.date, b.time)
    );

  }, [events]);


                                      
  const upcoming = ordered.filter(
    e => toDate(e.date, e.time) >= new Date()
  );

  const past = ordered.filter(
    e => toDate(e.date, e.time) < new Date()
  );


                                  
  const todayCount = upcoming.filter(
    e => e.date === dateString(new Date())
  ).length;


                                  
  const results = ordered.filter(e =>
    e.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    e.date.includes(query.trim())
  );


                         
  function Card({ item }) {

    return (
      <View style={s.card}>

        <Text style={s.eventName}>
          {item.name}
        </Text>

        <Text style={s.grey}>
          {pretty(item.date, item.time)}
        </Text>

        {!!item.description && (
          <Text style={s.desc}>
            {item.description}
          </Text>
        )}

        <Text style={s.badge}>
          🔔 Reminder: {item.reminder} minutes before
        </Text>

        <View style={s.actions}>

          <TouchableOpacity
            onPress={() => editEvent(item)}
            style={s.edit}
          >
            <Text
              style={{
                color: C.green,
                fontWeight: '700'
              }}
            >
              Edit
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => remove(item)}
            style={s.delete}
          >
            <Text
              style={{
                color: C.red,
                fontWeight: '700'
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    );

  }


                                                     
  function emptyState(message) {
    return (
      <View style={s.empty}>
        <Text style={{ fontSize: 32 }}>📅</Text>
        <Text style={s.eventName}>No events found</Text>
        <Text style={s.grey}>{message}</Text>
      </View>
    );
  }

                                                       
  function list(data, message) {
    if (data.length === 0) {
      return emptyState(message);
    }

    return (
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Card item={item} />}
      />
    );
  }                                        
  function pick(value) {

    if (picker === 'date') {
      setDate(dateString(value));
    } else {
      setTime(timeString(value));
    }

    setPicker('');

  }


  return (

    <SafeAreaView style={s.safe}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.bg}
      />


                        
      <View style={s.header}>

        <View>

          <Text style={s.brand}>
            Event Planner
          </Text>

          <Text style={s.grey}>
            Plan your time. Stay organised.
          </Text>

        </View>

        <Text style={s.logo}>
          EP
        </Text>

      </View>


                             
      <View style={s.tabs}>

        {['Home', 'Events', 'Search'].map(x => (

          <TouchableOpacity
            key={x}
            onPress={() => setTab(x)}
            style={[
              s.tab,
              tab === x && s.active
            ]}
          >

            <Text
              style={{
                color: tab === x ? C.blue : C.grey,
                fontWeight: '700'
              }}
            >
              {x}
            </Text>

          </TouchableOpacity>

        ))}

      </View>


      <View style={s.body}>


                           
        {tab === 'Home' && (

          <ScrollView>

            <Text style={s.heading}>
              Your schedule
            </Text>

            <Text style={s.grey}>
              Everything important, in one place.
            </Text>


                                    
            <View style={s.stats}>

              <View style={s.stat}>

                <Text style={s.number}>
                  {upcoming.length}
                </Text>

                <Text style={s.grey}>
                  Upcoming
                </Text>

              </View>


              <View style={s.stat}>

                <Text style={s.number}>
                  {todayCount}
                </Text>

                <Text style={s.grey}>
                  Today
                </Text>

              </View>

            </View>


                                       
            <TouchableOpacity
              style={s.primary}
              onPress={newEvent}
            >

              <Text style={s.primaryText}>
                + Create new event
              </Text>

            </TouchableOpacity>


            <Text style={s.subhead}>
              Next events
            </Text>

            {upcoming.length > 0 ? (
              upcoming.slice(0, 3).map(item => (
                <Card key={item.id} item={item} />
              ))
            ) : (
              emptyState('Add your first event to see it here.')
            )}

          </ScrollView>

        )}


                             
        {tab === 'Events' && (

          <View style={{ flex: 1 }}>

            <View style={s.row}>

              <Text style={s.heading}>
                All events
              </Text>

              <TouchableOpacity onPress={newEvent}>
                <Text style={s.link}>
                  + Add
                </Text>
              </TouchableOpacity>

            </View>


            <Text style={s.subhead}>
              Upcoming ({upcoming.length})
            </Text>


            <View style={{ flex: 1 }}>

              {list(
                upcoming,
                'No upcoming events. Add one to get started.'
              )}

            </View>


            {past.length > 0 && (

              <Text style={s.grey}>
                Past events: {past.length}
                {' '}(hidden from upcoming list)
              </Text>

            )}

          </View>

        )}


                             
        {tab === 'Search' && (

          <View style={{ flex: 1 }}>

            <Text style={s.heading}>
              Find an event
            </Text>

            <Text style={s.grey}>
              Search by event name or date (YYYY-MM-DD).
            </Text>


            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search events..."
              style={s.input}
            />


            <Text style={s.subhead}>
              Results ({results.length})
            </Text>


            <View style={{ flex: 1 }}>

              {list(
                results,
                'No events match your search.'
              )}

            </View>

          </View>

        )}

      </View>


                                    
      <Modal
        visible={modal}
        animationType="slide"
        onRequestClose={() => {
          setModal(false);
          clearForm();
        }}
      >

        <SafeAreaView style={s.safe}>

          <ScrollView
            contentContainerStyle={s.form}
            keyboardShouldPersistTaps="handled"
          >


                                
            <View style={s.row}>

              <Text style={s.heading}>
                {editing ? 'Edit event' : 'Create event'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setModal(false);
                  clearForm();
                }}
              >
                <Text style={s.link}>
                  Close
                </Text>
              </TouchableOpacity>

            </View>


                              
            <Text style={s.label}>
              Event name *
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter event name"
              style={s.input}
              maxLength={80}
            />


                              
            <Text style={s.label}>
              Date *
            </Text>

            <TouchableOpacity
              style={s.picker}
              onPress={() => setPicker('date')}
            >

              <Text>
                {date}
              </Text>

              <Text style={s.link}>
                Change
              </Text>

            </TouchableOpacity>


                              
            <Text style={s.label}>
              Time *
            </Text>

            <TouchableOpacity
              style={s.picker}
              onPress={() => setPicker('time')}
            >

              <Text>
                {time}
              </Text>

              <Text style={s.link}>
                Change
              </Text>

            </TouchableOpacity>


                                        
            {!!picker && (

              <DateTimePicker
                value={toDate(date, time)}
                mode={picker}
                display="default"
                minimumDate={
                  picker === 'date' ? new Date() : undefined
                }
                onChange={(ev, d) => {

                  if (Platform.OS === 'android') {
                    setPicker('');
                  }

                  if (d) {
                    pick(d);
                  }

                }}
              />

            )}


                               
            <Text style={s.label}>
              Description (optional)
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Event details"
              multiline
              style={[
                s.input,
                {
                  height: 100,
                  textAlignVertical: 'top'
                }
              ]}
              maxLength={500}
            />


                            
            <Text style={s.label}>
              Reminder (minutes before)
            </Text>

            <TextInput
              value={reminder}
              onChangeText={setReminder}
              keyboardType="number-pad"
              style={s.input}
            />

            <Text style={s.grey}>
              Example: 10 means notify 10 minutes before the event.
            </Text>


                               
            <TouchableOpacity
              style={s.primary}
              onPress={save}
            >

              <Text style={s.primaryText}>
                {editing ? 'Update event' : 'Save event'}
              </Text>

            </TouchableOpacity>


                                 
            <TouchableOpacity
              onPress={() => {
                setModal(false);
                clearForm();
              }}
              style={{
                alignItems: 'center',
                padding: 12
              }}
            >

              <Text style={s.grey}>
                Cancel
              </Text>

            </TouchableOpacity>

          </ScrollView>

        </SafeAreaView>

      </Modal>

    </SafeAreaView>

  );

}


         
const s = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: C.bg
  },

  header: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  brand: {
    fontSize: 23,
    fontWeight: '800',
    color: C.dark
  },

  grey: {
    color: C.grey,
    fontSize: 13,
    marginTop: 4
  },

  logo: {
    backgroundColor: '#E7EDFF',
    color: C.blue,
    fontWeight: '800',
    padding: 13,
    borderRadius: 13
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 17,
    backgroundColor: '#E9EEF7',
    padding: 4,
    borderRadius: 12
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 9
  },

  active: {
    backgroundColor: C.white
  },

  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    marginVertical: 5
  },

  stats: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 15
  },

  stat: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: C.border
  },

  number: {
    fontSize: 27,
    color: C.blue,
    fontWeight: '800'
  },

  primary: {
    backgroundColor: C.blue,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginVertical: 13
  },

  primaryText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15
  },

  subhead: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark,
    marginVertical: 10
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 11
  },

  eventName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.dark
  },

  desc: {
    color: '#4A5568',
    marginTop: 8
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF0FF',
    color: C.blue,
    padding: 6,
    borderRadius: 7,
    overflow: 'hidden',
    fontSize: 11,
    marginTop: 9
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 10
  },

  edit: {
    backgroundColor: '#E9F6F0',
    padding: 9,
    borderRadius: 8
  },

  delete: {
    backgroundColor: '#FCEBED',
    padding: 9,
    borderRadius: 8
  },

  empty: {
    alignItems: 'center',
    padding: 35
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  link: {
    color: C.blue,
    fontWeight: '800'
  },

  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    marginVertical: 9,
    color: C.dark
  },

  form: {
    padding: 20,
    flexGrow: 1
  },

  label: {
    fontWeight: '700',
    color: C.dark,
    marginTop: 10,
    marginBottom: 3
  },

  picker: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    marginVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }

});


