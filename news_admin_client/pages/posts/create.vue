<template>
  <center class="mt-5 mb-15">
    <div class="w-75">
      <v-text-field label="Title" v-model="postInfo.title"></v-text-field>
      <img :src="bannerPreview" />
      <v-file-input
        v-model="postInfo.banner_img"
        @change="previewImage"
        @click:clear="previewImage"
        clearable
        label="File input"
        variant="solo-filled"
        show-size
        accept="image/png, image/jpeg"
        class="w-50"
      ></v-file-input>
      <!-- USE DATE PICKER INSTEAD -->
      <v-text-field
        class="w-25"
        v-model="postInfo.deadline"
        variant="solo-filled"
        type="date"
      ></v-text-field>
      <v-autocomplete
        v-model="postInfo.tags"
        class="w-50"
        clearable
        chips
        label="Tags"
        :items="tags"
        multiple
        variant="solo-filled"
      ></v-autocomplete>
      <v-combobox
        v-model="postInfo.keywords"
        clearable
        chips
        multiple
        label="Keyword"
      ></v-combobox>
      <v-textarea
        label="Description"
        variant="solo-filled"
        v-model="postInfo.description"
      ></v-textarea>
      <v-card>
        <editor
          api-key="xidtifz02mui7lrdh7iq49zlrykxh4o1lqbdcrxy9zsfpnwi"
          :init="{
            height: 1000,
            menubar: false,
            plugins: [
              'advlist autolink lists link image charmap print preview anchor',
              'searchreplace visualblocks code fullscreen',
              'insertdatetime media table paste code help wordcount',
            ],
            toolbar:
              'undo redo | formatselect | bold italic backcolor | \
                    alignleft aligncenter alignright alignjustify | \
                    bullist numlist outdent indent | removeformat | help',
          }"
          v-model="postInfo.content"
          initial-value="Loading..."
          output-format="html"
        />
      </v-card>
      <center class="my-5">
        <v-btn prepend-icon="$vuetify" :loading="updating" @click="onCreatePost"
          >CREATE</v-btn
        >
      </center>
    </div>
    <v-snackbar v-model="snackbar" vertical>
      <div class="text-subtitle-1 pb-2">Post saved</div>
      <template v-slot:actions>
        <v-btn
          color="indigo"
          variant="text"
          :href="`${clientLink}/posts/${postInfo?.id}`"
          target="_blank"
        >
          View
        </v-btn>
        <v-btn color="indigo" variant="text" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </center>
</template>

<script setup lang="ts">
// TODO:
// duplicate code
import { ref, onMounted, watch, computed, getCurrentInstance } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { fetchWithAuth, fetchMultiPartWithAuth } from "@utils/betterFetch";
import Editor from "@tinymce/tinymce-vue";
import { IvolunteerPageTagsEnum } from "@types/enums";

const config = useRuntimeConfig();
const { fetchLink, clientLink } = config.public;

const vm = getCurrentInstance().proxy;
// TODO: snackbar component
const snackbar = ref<Boolean>(false);
const postInfo = ref({
	title: "",
	description: "",
	banner_img: "",
	content: "",
	deadline: "",
	tags: [],
	keywords: ["học sinh", "sinh viên"],
});
const tags = ref<IvolunteerPageTagsEnum[]>(
	Object.values(IvolunteerPageTagsEnum),
);
const updating = ref<Boolean>(false);
const bannerPreview = ref();
const previewImage = () => {
	bannerPreview.value = postInfo.value.banner_img[0]
		? URL.createObjectURL(postInfo.value.banner_img[0])
		: "";
};
const onCreatePost = async () => {
	if (
		postInfo.value.title === "" ||
		postInfo.value.description === "" ||
		postInfo.value.content === "" ||
		bannerPreview.value === "" ||
		postInfo.value.deadline === "" ||
		postInfo.value.keywords.length === 0 ||
		postInfo.value.tags.length === 0
	) {
		window.alert("Fill all fields before create");
		return;
	}
	updating.value = true;
	const body = new FormData();
	body.set("file", postInfo.value.banner_img[0]);
	body.set("title", postInfo.value.title);
	const fileResponse = await fetchMultiPartWithAuth(
		`${fetchLink}/admin/posts/_file`,
		{
			method: "POST",
			body: body,
		},
	);
	if (!fileResponse.ok) {
		window.alert("CREATE FAIL");
		updating.value = false;
		return;
	}
	const banner = (await fileResponse.json()).file;
	delete postInfo.value.banner_img;
	const response = await fetchWithAuth(`${fetchLink}/admin/posts`, {
		method: "POST",
		body: JSON.stringify({
			...postInfo.value,
			banner: banner,
		}),
	});
	if (response.ok) window.alert("Create success");
	else window.alert("CREATE FAIL");
	updating.value = false;
};
</script>

<style style lang="sass"></style>
