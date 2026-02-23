import { computed, ref, watch } from "vue";
import { runtimeConfig } from "@/config/runtimeConfig";
import {
	StorageSerializers,
	createGlobalState,
	useStorage,
} from "@vueuse/core";
import { useAuthStore } from "./auth";
import {useErrorStore} from "./common";
import { api } from "@/utils/betterFetch";
import _ from "lodash";

export const useLocalAudioDBStore = createGlobalState(() => {
	const blobUrl = ref<string>(""); // Ref to hold the Blob URL for useSound
	const audioDataLoaded = ref(false); // Flag to indicate if audio is ready

	const dbName = "musicDB";
	const dbVersion = 1;
	const objectStoreName = "audio";

	// --- IndexedDB Logic ---
	const initDB = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName, dbVersion);
			request.onerror = (event: Event) => {
				console.error("IndexedDB error:", (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			};
			request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(objectStoreName)) {
					const objectStore = db.createObjectStore(objectStoreName, {
						keyPath: "id",
					});
					objectStore.createIndex("name", "name", { unique: false });
				} else {
				}
			};
			request.onsuccess = (event: Event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				resolve(db);
			};
		});
	};

	const getAudioFromDB = (db: IDBDatabase, id: number): Promise<any | null> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([objectStoreName], "readonly");
			const objectStore = transaction.objectStore(objectStoreName);
			const request = objectStore.get(id);
			request.onsuccess = (event: Event) => {
				resolve((event.target as IDBRequest).result);
			};
			request.onerror = (event: Event) => {
				console.error(
					"Error getting audio from DB:",
					(event.target as IDBRequest).error,
				);
				reject((event.target as IDBRequest).error);
			};
		});
	};

	const storeAudioInDB = (
		db: IDBDatabase,
		audioData: ArrayBuffer,
		id: number,
		name: string,
	): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([objectStoreName], "readwrite");
			const objectStore = transaction.objectStore(objectStoreName);
			const request = objectStore.put({ id: id, name: name, data: audioData });
			request.onsuccess = () => {
				resolve(true);
			};
			request.onerror = (event: Event) => {
				console.error(
					"Error storing audio",
					(event.target as IDBRequest).error,
				);
				reject((event.target as IDBRequest).error);
			};
		});
	};

	const loadAndSetAudio = async () => {
		let db: IDBDatabase | null = null;
		try {
			db = await initDB();
			const audioId = 1; // Using a fixed ID for the sample audio
			const audioName = "sample";
			const existingAudio = await getAudioFromDB(db, audioId);

			let audioData: ArrayBuffer;

			if (existingAudio && existingAudio.data instanceof ArrayBuffer) {
				audioData = existingAudio.data;
			} else {
				// Fetch the default audio file if not found in DB
				const response = await fetch("/audio/musical/sample.mp3");
				if (!response.ok) {
					throw new Error(`Failed to fetch audio: ${response.statusText}`);
				}
				audioData = await response.arrayBuffer();
				await storeAudioInDB(db, audioData, audioId, audioName);
			}

			// Create Blob URL
			const blob = new Blob([audioData], { type: "audio/mp3" }); // Changed MIME type to audio/mp3
			// Check if blobUrl is not the initial empty string before revoking
			if (blobUrl.value && blobUrl.value !== "") {
				URL.revokeObjectURL(blobUrl.value); // Revoke previous URL if exists
			}
			blobUrl.value = URL.createObjectURL(blob);
			audioDataLoaded.value = true; // Mark audio as ready
		} catch (error) {
			console.error("Error loading/setting audio:", error);
			audioDataLoaded.value = false; // Ensure loaded state is false on error
			// Check if blobUrl is not the initial empty string before revoking
			if (blobUrl.value && blobUrl.value !== "") {
				// Clean up potentially stale blob URL on error
				URL.revokeObjectURL(blobUrl.value);
				blobUrl.value = ""; // Reset to empty string
			}
			// Handle error appropriately (e.g., show a message to the user)
		} finally {
			if (db) {
				db.close(); // Close the DB connection
			}
		}
	};

	return {
		blobUrl,
		audioDataLoaded,
		getAudioFromDB,
		loadAndSetAudio,
	};
});

export const useAudioStore = createGlobalState(() => {
	const API_URL = runtimeConfig.public.API_URL;
	const { showError } = useErrorStore();
	const { isAuth } = useAuthStore();

	// state
	const tracks = useStorage("audioTracks", []);

	// getters

	// actions
	const getAudioTracksInfo = async () => {
		if (!isAuth.value) return;
		const response = await api.get(`${API_URL}/audios`);
		if (response?.ok) tracks.value = await response.json();
		else {
			const errorMsg = "Failed to get audio tracks";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};
	const downloadAudioTracks = async () => {};

	const createAudioTrack = async () => {
		if (!isAuth.value) return;
		const response = await api.post(`${API_URL}/audios`);
		if (response?.ok) console.log(await response.json());
		else {
			const errorMsg = "Failed to get audio track";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};

	const deleteAudioTrack = async () => {
		if (!isAuth.value) return;
		const response = await api.delete(`${API_URL}/audios`);
		if (response?.ok) console.log();
		else {
			const errorMsg = "Failed to delete audio track";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};

	const getCurrentTrack = () => {};
	const getNextTrack = () => {};
	const getPreviousTrack = () => {};

	return {
		// state
		// getters
		// actions
		getAudioTracksInfo,
		downloadAudioTracks,
		createAudioTrack,
		deleteAudioTrack,
		getCurrentTrack,
		getNextTrack,
		getPreviousTrack,
	};
});
