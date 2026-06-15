<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8">
    <div class="text-center max-w-md mx-auto">
      <!-- 404 Number with enhanced styling -->
      <div class="relative mb-8">
        <h1
          class="text-8xl md:text-9xl font-black select-none transition-colors duration-300 text-gray-700 drop-shadow-2xl"
        >
          404
        </h1>
        <!-- Decorative elements -->
        <div
          class="absolute -top-4 -right-4 w-8 h-8 rounded-full animate-pulse bg-indigo-400"
        ></div>
        <div
          class="absolute -bottom-2 -left-2 w-6 h-6 rounded-full animate-bounce delay-300 bg-purple-400"
        ></div>
      </div>

      <!-- Main heading -->
      <h2
        class="text-2xl md:text-4xl font-bold tracking-tight mb-4 transition-colors duration-300 text-white"
      >
        Oops! Page Not Found
      </h2>

      <!-- Description -->
      <p
        class="text-lg mb-8 leading-relaxed transition-colors duration-300 text-gray-300"
      >
        The page you're looking for seems to have wandered off into the digital
        void.
      </p>

      <!-- Action buttons -->
      <div
        class="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center"
      >
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 focus:ring-offset-gray-900"
        >
          <Home class="w-4 h-4 mr-2" stroke-width="2" />
          Go Back Home
        </NuxtLink>

        <button
          @click="goBack"
          class="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white focus:ring-gray-500 focus:ring-offset-gray-900"
        >
          <ArrowLeft class="w-4 h-4 mr-2" stroke-width="2" />
          Go Back
        </button>
      </div>

      <!-- Additional help text -->
      <p class="text-sm mt-8 transition-colors duration-300 text-gray-400">
        If you believe this is an error, please
        <a
          href="mailto:support@example.com"
          class="underline transition-colors duration-200 text-indigo-400 hover:text-indigo-300"
        >
          contact support
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { Home, ArrowLeft } from "lucide-vue-next";

definePageMeta({
  layout: "auth",
  requiresAuth: false,
});

const router = useRouter();

// Go back function
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/");
  }
};
</script>
