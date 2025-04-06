<template>
  <div class="d-flex justify-center w-100 mt-5 mb-15">
    <div v-if="pageInfo" class="w-75">
      <div class="d-flex justify-center align-center mb-4">
        <v-text-field
          label="Title"
          v-model="pageInfo.title"
          ref="title"
          :rules="[
            (val) => val.length >= 1 || `Hãy điền title`,
            (val) =>
              val.length <= 100 ||
              `Chỉnh title ít hơn 100 chữ. Hiện tại: ${val.length} chữ`,
          ]"
          @update:model-value="onTitleChanged"
        ></v-text-field>
        <v-btn
          class="ml-4 bg-teal-lighten-1"
          @click="onAIPromptGenerate(pageInfo.title, AIPromtTypeEnum.TITLE)"
          :loading="aiPrompt.loading"
          >AI</v-btn
        >
      </div>
      <v-card
        v-if="aiPrompt.title"
        variant="elevated"
        class="w-75 bg-teal-lighten-1"
        color="surface-variant"
        title="Title được đề xuất bởi AI"
        >{{ aiPrompt.title }}</v-card
      >
      <br />
      <img :src="`${fetchLink}/media/${pageInfo?.banner}`" />
      <v-file-input
        clearable
        label="To do..."
        variant="solo-filled"
        class="w-50"
        :disabled="true"
      ></v-file-input>
      <v-chip variant="flat" color="primary" size="x-large" class="mb-5">
        Deadline: {{ pageInfo.deadline || "ASAP" }}
      </v-chip>
      <v-chip variant="flat" color="error" size="x-large" class="ml-2 mb-5" v-if="pageInfo.deadline && new Date(pageInfo.deadline)  < Date.now()">
        Expired
      </v-chip>
      <v-autocomplete
        v-model="pageInfo.tags"
        class="w-50"
        clearable
        chips
        label="Tags"
        :items="tags"
        multiple
        variant="solo-filled"
        :rules="[(val) => !!(val && val.length) || `Hãy chọn tags`]"
      ></v-autocomplete>
      <v-combobox
        v-model="pageInfo.keywords"
        clearable
        @update:model-value="onKeywordChanged"
        chips
        multiple
        label="Keyword"
      ></v-combobox>
      <div class="d-flex justify-center align-center mb-4">
        <v-textarea
          label="Description"
          variant="solo-filled"
          v-model="pageInfo.description"
        ></v-textarea>
        <v-btn
          class="ml-4 bg-teal-lighten-1"
          @click="
            onAIPromptGenerate(
              pageInfo.description,
              AIPromtTypeEnum.DESCRIPTION,
            )
          "
          :loading="aiPrompt.loading"
          >AI</v-btn
        >
      </div>
      <v-card
        v-if="aiPrompt.description"
        variant="elevated"
        class="w-75 bg-teal-lighten-1"
        color="surface-variant"
        title="Description được đề xuất bởi AI"
        >{{ aiPrompt.description }}</v-card
      >
      <br />
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
          v-model="pageInfo.content"
          initial-value="Loading..."
          output-format="html"
        />
      </v-card>
      <!-- <v-btn
        class="ml-4 bg-teal-lighten-1"
        @click="onAIPromptGenerate(pageInfo.content, AIPromtTypeEnum.CONTENT)"
        :loading="aiPrompt.loading"
        >AI</v-btn
      >
      <v-card
        v-if="aiPrompt.content"
        variant="elevated"
        class="w-75 bg-teal-lighten-1"
        color="surface-variant"
        title="Content được đề xuất bởi AI"
        ><span v-html="render(parse(aiPrompt.content))"></span></v-card
      > -->
      <v-stepper
        :items="['Step 1(Optional)', 'Step 2(Optional)', 'Step 3']"
        class="mt-10"
      >
        <template v-slot:item.1>
          <v-card title="Chỉnh sửa nội dung" flat></v-card>
          <div class="d-flex justify-center my-5" :color="'green'">
            <v-btn
              prepend-icon="$vuetify"
              @click="onSaveDraft(true)"
              :disabled="!canSave"
            >
              <template v-slot:prepend>
                <v-icon color="success"></v-icon>
              </template>
              Save draft
            </v-btn>
          </div>
        </template>

        <template v-slot:item.2>
          <v-card title="Xem trước nội dung đăng lên web" flat></v-card>
          <div class="d-flex justify-center my-5" :color="'green'">
            <v-btn
              prepend-icon="$vuetify"
              @click="onHtmlPreview"
              :disabled="true"
            >
              <template v-slot:prepend>
                <v-icon color="success"></v-icon>
              </template>
              TO DO...
            </v-btn>
          </div>
          <v-card title="Xem trước nội dung đăng lên facebook" flat></v-card>
          <div class="d-flex justify-center my-5" :color="'green'">
            <v-btn
              prepend-icon="$vuetify"
              @click="onFacebookPreview"
              :disabled="true"
            >
              <template v-slot:prepend>
                <v-icon color="success"></v-icon>
              </template>
              TO DO...
            </v-btn>
          </div>
          <v-card title="Xem trước bài đăng lên discord" flat></v-card>
          <div class="d-flex justify-center my-5">
            <v-btn
              prepend-icon="$vuetify"
              :loading="updating"
              @click="onDiscordPreview"
              :disabled="!canSave"
            >
              <template v-slot:prepend>
                <v-icon color="success"></v-icon>
              </template>
              Send
            </v-btn>
          </div>
        </template>

        <template v-slot:item.3>
          <v-card title="Tạo bài viết mới" flat></v-card>


          <div class="d-flex justify-center my-5">
          <v-row>
            <v-checkbox label="Create Facebook post" v-model="shouldCreateSocialMediaPost"></v-checkbox>
          </v-row>
          <v-row>
            <v-btn
              prepend-icon="$vuetify"
              type="submit"
              :disabled="!canSave"
              :loading="updating"
              @click="onCreatePost"
              >CREATE</v-btn
            >
          </v-row>
          </div>
        </template>
      </v-stepper>
    </div>

    <v-progress-circular
      v-else
      indeterminate
      color="green"
    ></v-progress-circular>
    <v-snackbar v-model="snackbar" vertical :timeout="-1">
      <div class="text-subtitle-1 pb-2">View created post</div>
      <template v-slot:actions>
        <v-btn
          color="green"
          variant="text"
          :href="`${clientLink}/posts/${pageInfo?.id}`"
          target="_blank"
        >
          View
        </v-btn>
        <v-btn
          color="green"
          variant="text"
          :href="`/posts/${pageInfo?.id}`"
          target="_blank"
        >
          Edit
        </v-btn>
        <v-btn color="green" variant="text" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from "nuxt/app";
import { onMounted } from "vue";
import Editor from "@tinymce/tinymce-vue";
import { useProvideCrawlerIvolunteerStore } from "./store.ts";
import { AIPromtTypeEnum } from "@types/enums";
import parse from "gemini-to-html/parse";
import render from "gemini-to-html/render";

const props = defineProps({
	link: {
		type: String,
		required: true,
	},
});
const config = useRuntimeConfig();
const { fetchLink, clientLink } = config.public;
const {
	// state
	pageInfo,
	shouldCreateSocialMediaPost,
	updating,
	aiPrompt,
	tags,
	snackbar,
	// getters
	canSave,
	// actions
	getPageInfo,
	onSaveDraft,
	onCreatePost,
	onAIPromptGenerate,
	onDiscordPreview,
	onHtmlPreview,
	onFacebookPreview,
	onTitleChanged,
	onKeywordChanged,
} = useProvideCrawlerIvolunteerStore(props.link);

onMounted(async () => {
	await getPageInfo();
});
</script>

<style style lang="sass"></style>
