# Event Planner App

**Student name:** Mourshika  
**Index number:** JF/ICT/25/32  
**Module:** Mobile Application Development (K72T001M15)

## Description

Event Planner is a React Native and Expo app for creating and organizing events. Event information is stored locally on the device.

## Features

- Create events with a name, date, time, and optional description.
- Validate event names, future dates and times, and reminder intervals.
- View upcoming events in date and time order; past events are kept out of the upcoming list.
- Edit events and confirm before deleting them.
- Search events by name or date.
- Request notification permission and schedule a local reminder in minutes before an event.
- Save events on the device with AsyncStorage.

## Technologies

- React Native
- Expo
- AsyncStorage
- Expo Notifications
- React Native DateTimePicker

## Run the app

Open a terminal in this project folder and run:

```bash
npm install
npx expo start
```

Open the project in Expo Go or an Android emulator. For notification testing, allow notification permission and use a device setup that supports Expo Notifications.

## Testing checklist

Record the result of each check before submission.

- [x] Create a valid future event (`QA Demo`, Nov 2, 2026 at 1:00 AM).
- [x] Try saving an event without a name; confirm it is rejected.
- [x] Try saving a past date and time; confirm it is rejected.
- [x] Confirm the event list is ordered by date and time (QA Demo appears before later events on Home).
- [x] Open ICA2 in the edit form and change its time using the time picker.
- [x] Cancel a deletion and confirm the event remains.
- [x] Open the delete confirmation for `QA Demo`.
- [x] Search for `assi` and confirm two matching results.
- [x] Search for `2026-11-05` and confirm ICA2 appears.
- [x] Reload the app in Expo Go and confirm saved events remain.
- [x] Confirm the empty-state message appears when there are no matching events.

## Screenshots

Screenshots captured while testing the app:

![Create event form](screenshots/Screenshot%202026-11-02%20005311.png)

![Required event name validation](screenshots/Screenshot%202026-11-02%20005402.png)

![Past event validation](screenshots/Screenshot%202026-11-02%20005535.png)

![Home screen](screenshots/Screenshot%202026-11-02%20005715.png)

![Time picker while editing an event](screenshots/Screenshot%202026-11-02%20005832.png)

![Delete confirmation dialog](screenshots/Screenshot%202026-11-02%20005904.png)

![Search results for an event name](screenshots/Screenshot%202026-11-02%20005942.png)

![Search results for a date](screenshots/Screenshot%202026-11-02%20010126.png)
