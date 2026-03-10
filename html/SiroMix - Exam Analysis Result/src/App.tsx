import { Icon } from '@iconify/react';

export default function App() {
  const questions = [
    { id: 1, name: 'Question 1', answer: 'A', confidence: '92%', status: 'high' },
    { id: 2, name: 'Question 2', answer: 'C', confidence: '85%', status: 'high' },
    { id: 3, name: 'Question 3', answer: 'B', confidence: '78%', status: 'medium' },
    { id: 4, name: 'Question 4', answer: 'D', confidence: '95%', status: 'high' },
    { id: 5, name: 'Question 5', answer: 'A', confidence: '55%', status: 'low' },
    { id: 6, name: 'Question 6', answer: 'B', confidence: '88%', status: 'high' },
    { id: 7, name: 'Question 7', answer: 'C', confidence: '99%', status: 'high' },
    { id: 8, name: 'Question 8', answer: 'A', confidence: '82%', status: 'medium' },
    { id: 9, name: 'Question 9', answer: 'D', confidence: '64%', status: 'medium' },
    { id: 10, name: 'Question 10', answer: 'B', confidence: '91%', status: 'high' },
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'high':
        return 'bg-[#39a85e]/[0.15] text-[#39a85e]';
      case 'medium':
        return 'bg-[#fcb831]/[0.15] text-[#C98703]';
      case 'low':
        return 'bg-[#d3595e]/[0.15] text-[#d3595e]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#171a1f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#dee1e6] h-16 flex items-center px-4 lg:px-6 justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#9a94de]/[0.1] rounded-[10px] flex items-center justify-center shadow-sm">
              <svg data-svg-id="SVG_3" className="w-[19px] h-[19px] text-[#9a94de]" viewBox="0 0 19 19">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.79 0 0 0.79 9.51 5.54)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12.01, -7)" d="M 1.00348 6.99475 C 1.00353 6.60711 1.11606 6.22772 1.3277 5.90295 C 1.53745 5.58123 1.83572 5.32645 2.1861 5.16956 L 10.7554 1.27014 L 10.9029 1.20764 C 11.2518 1.07053 11.6237 0.99969 11.9996 0.999634 C 12.4291 0.999634 12.8539 1.09195 13.2447 1.27014 L 21.8345 5.1803 C 22.1849 5.33718 22.4822 5.59098 22.692 5.91272 C 22.9037 6.2375 23.0161 6.61682 23.0162 7.00452 C 23.0162 7.39238 22.9038 7.77237 22.692 8.09729 C 22.482 8.41928 22.1833 8.67286 21.8326 8.82971 L 21.8336 8.83069 L 13.2545 12.7291 L 13.2554 12.7301 C 12.9133 12.8861 12.545 12.9757 12.1705 12.9957 L 12.0103 13.0006 C 11.6343 13.0006 11.2617 12.9298 10.9127 12.7926 L 10.7652 12.7301 L 2.18512 8.81995 C 1.83533 8.66301 1.53718 8.40883 1.3277 8.08752 C 1.11587 7.76261 1.00348 7.38262 1.00348 6.99475 Z M 3.0152 6.99963 L 11.5943 10.9098 L 11.6949 10.9489 C 11.7964 10.9826 11.9029 11.0006 12.0103 11.0006 L 12.1168 10.9948 C 12.2232 10.9833 12.3276 10.9544 12.4254 10.9098 L 21.0064 7.0094 L 21.0162 7.00452 L 21.0054 7.00061 L 12.4156 3.09045 L 12.4146 3.08948 C 12.2845 3.03019 12.1426 2.99963 11.9996 2.99963 C 11.8925 2.99968 11.7863 3.01684 11.6851 3.05042 L 11.5855 3.08948 L 11.5845 3.09045 L 3.00348 6.99475 L 3.0152 6.99963 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.79 0 0 0.79 9.5 11.48)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -14.5)" d="M 21.9922 11 C 22.5098 10.996 22.9389 11.386 22.9941 11.8896 L 23 11.9922 L 22.9961 12.1367 C 22.9743 12.4742 22.867 12.8019 22.6836 13.0879 C 22.4741 13.4144 22.1741 13.6729 21.8203 13.832 L 13.2441 17.7305 L 13.2422 17.7314 C 12.8535 17.9074 12.4315 17.998 12.0049 17.998 C 11.5782 17.998 11.1563 17.9074 10.7676 17.7314 L 10.7666 17.7305 L 2.16602 13.8203 L 2.16016 13.8174 C 1.813 13.6567 1.51909 13.3997 1.31348 13.0771 C 1.10795 12.7546 0.99906 12.3795 1.00001 11.9971 L 1.00587 11.8955 C 1.05825 11.3913 1.48511 10.9987 2.00294 11 C 2.55484 11.0016 3.00011 11.4501 2.99903 12.002 L 11.5918 15.9092 L 11.5928 15.9092 C 11.7223 15.9678 11.8628 15.998 12.0049 15.998 C 12.1467 15.998 12.2868 15.9675 12.416 15.9092 L 20.9961 12.0098 L 21 12.0078 L 21.0039 11.9053 C 21.0513 11.4008 21.4745 11.0041 21.9922 11 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.79 0 0 0.79 9.5 15.44)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -19.5)" d="M 21.9922 16 C 22.5098 15.996 22.9389 16.386 22.9941 16.8896 L 23 16.9922 L 22.9961 17.1367 C 22.9743 17.4742 22.867 17.8019 22.6836 18.0879 C 22.4741 18.4144 22.1741 18.6729 21.8203 18.832 L 13.2441 22.7305 L 13.2422 22.7314 C 12.8535 22.9074 12.4315 22.998 12.0049 22.998 C 11.5782 22.998 11.1563 22.9074 10.7676 22.7314 L 10.7666 22.7305 L 2.16602 18.8203 L 2.16016 18.8174 C 1.813 18.6567 1.51909 18.3997 1.31348 18.0771 C 1.10795 17.7546 0.99906 17.3795 1.00001 16.9971 L 1.00587 16.8955 C 1.05825 16.3913 1.48511 15.9987 2.00294 16 C 2.55484 16.0016 3.00011 16.4501 2.99903 17.002 L 11.5918 20.9092 L 11.5928 20.9092 C 11.7223 20.9678 11.8628 20.998 12.0049 20.998 C 12.1467 20.998 12.2868 20.9675 12.416 20.9092 L 20.9961 17.0098 L 21 17.0078 L 21.0039 16.9053 C 21.0513 16.4008 21.4745 16.0041 21.9922 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">SiroMix</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#565d6d]">
            <a href="#" className="hover:text-[#171a1f] transition-colors">Features</a>
            <a href="#" className="hover:text-[#171a1f] transition-colors">User Guide</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold leading-none">Alex Morgan</span>
            <span className="text-[12px] text-[#565d6d]">Teacher</span>
          </div>
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#dee1e6]/50 shadow-sm">
            <img src="./assets/IMG_2.webp" alt="User" className="w-full h-full object-cover" />
          </div>
          <svg data-svg-id="SVG_2" className="w-4 h-4 text-[#565d6d] cursor-pointer" viewBox="0 0 16 16">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.67 0 0 0.67 8 8)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 8.29302 C 17.6835 7.90249 18.3165 7.90249 18.707 8.29302 C 19.0976 8.68354 19.0976 9.31655 18.707 9.70708 L 12.707 15.7071 C 12.3165 16.0976 11.6835 16.0976 11.293 15.7071 L 5.29298 9.70708 L 5.22462 9.63091 C 4.90427 9.23813 4.92686 8.65913 5.29298 8.29302 C 5.65909 7.9269 6.2381 7.90431 6.63087 8.22466 L 6.70704 8.29302 L 12 13.586 L 17.293 8.29302 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1152px] mx-auto px-4 pt-12 pb-32">
        <div className="mb-8">
          <h1 className="text-[30px] leading-[36px] font-bold tracking-tight mb-2">
            Xem trước kết quả phân tích đề thi
          </h1>
          <p className="text-[#565d6d] text-base">
            Xem trước các câu hỏi đã trích xuất và đáp án được nhận diện trước khi tiếp tục.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-[#dee1e6] rounded-lg shadow-sm p-4 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#dee1e6]/60">
          <div className="flex items-center gap-3 px-2 py-2 md:py-0">
            <div className="w-8 h-8 bg-[#9a94de]/[0.1] rounded-md flex items-center justify-center flex-shrink-0">
              <svg data-svg-id="SVG_4" className="w-4 h-4 text-[#9a94de]" viewBox="0 0 16 16">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.67 0 0 0.67 8 8)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 3 20 L 3 4 C 3 3.20435 3.3163 2.44152 3.87891 1.87891 C 4.44152 1.3163 5.20435 1 6 1 L 15 1 L 15.0986 1.00488 C 15.3276 1.02757 15.5429 1.12883 15.707 1.29297 L 20.707 6.29297 C 20.8946 6.48051 21 6.73478 21 7 L 21 20 C 21 20.7957 20.6837 21.5585 20.1211 22.1211 C 19.5585 22.6837 18.7957 23 18 23 L 6 23 C 5.20435 23 4.44152 22.6837 3.87891 22.1211 C 3.3163 21.5585 3 20.7956 3 20 Z M 5 20 C 5 20.2652 5.10543 20.5195 5.29297 20.707 C 5.48051 20.8946 5.73478 21 6 21 L 18 21 C 18.2652 21 18.5195 20.8946 18.707 20.707 C 18.8946 20.5195 19 20.2652 19 20 L 19 7.41406 L 14.5859 3 L 6 3 C 5.73478 3 5.48051 3.10543 5.29297 3.29297 C 5.10543 3.48051 5 3.73478 5 4 L 5 20 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 11.33 3.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-17, -5)" d="M 13 6 L 13 2 C 13 1.44772 13.4477 1 14 1 C 14.5523 1 15 1.44772 15 2 L 15 6 C 15 6.26522 15.1054 6.51949 15.293 6.70703 C 15.4805 6.89457 15.7348 7 16 7 L 20 7 C 20.5523 7 21 7.44772 21 8 C 21 8.55228 20.5523 9 20 9 L 16 9 C 15.2044 9 14.4415 8.6837 13.8789 8.12109 C 13.3163 7.55848 13 6.79565 13 6 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 6 6)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -9)" d="M 10 8 C 10.5523 8 11 8.44772 11 9 C 11 9.55228 10.5523 10 10 10 L 8 10 C 7.44772 10 7 9.55228 7 9 C 7 8.44772 7.44772 8 8 8 L 10 8 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 8 8.67)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -13)" d="M 16 12 C 16.5523 12 17 12.4477 17 13 C 17 13.5523 16.5523 14 16 14 L 8 14 C 7.44772 14 7 13.5523 7 13 C 7 12.4477 7.44772 12 8 12 L 16 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 8 11.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -17)" d="M 16 16 C 16.5523 16 17 16.4477 17 17 C 17 17.5523 16.5523 18 16 18 L 8 18 C 7.44772 18 7 17.5523 7 17 C 7 16.4477 7.44772 16 8 16 L 16 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">Tên kì thi</p>
              <p className="text-sm font-medium">Giữa kì I</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 md:px-6 py-2 md:py-0">
            <div className="w-8 h-8 bg-[#f3f4f6] rounded-md flex items-center justify-center flex-shrink-0">
              <svg data-svg-id="SVG_5" className="w-4 h-4 text-[#565d6d]" viewBox="0 0 16 16">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.67 0 0 0.67 8 9.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -14)" d="M 11 21 L 11 7 C 11 6.44772 11.4477 6 12 6 C 12.5523 6 13 6.44772 13 7 L 13 21 C 13 21.5523 12.5523 22 12 22 C 11.4477 22 11 21.5523 11 21 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 8 8)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 16 4 C 15.2044 4 14.4415 4.3163 13.8789 4.87891 C 13.3163 5.44152 13 6.20435 13 7 L 12.9951 7.10254 C 12.9438 7.60667 12.5177 8 12 8 C 11.4477 8 11 7.55228 11 7 C 11 6.20435 10.6837 5.44152 10.1211 4.87891 C 9.55848 4.3163 8.79565 4 8 4 L 3 4 L 3 17 L 9 17 L 9.19824 17.0049 C 10.1869 17.0539 11.1248 17.4686 11.8281 18.1719 C 11.8876 18.2314 11.9447 18.2927 12 18.3555 C 12.0553 18.2927 12.1124 18.2314 12.1719 18.1719 C 12.922 17.4217 13.9391 17 15 17 L 21 17 L 21 4 L 16 4 Z M 23 17 C 23 17.5304 22.7891 18.039 22.4141 18.4141 C 22.039 18.7891 21.5304 19 21 19 L 15 19 C 14.4696 19 13.961 19.2109 13.5859 19.5859 C 13.2109 19.961 13 20.4696 13 21 C 13 21.5523 12.5523 22 12 22 C 11.4477 22 11 21.5523 11 21 C 11 20.4696 10.7891 19.961 10.4141 19.5859 C 10.0858 19.2577 9.65526 19.0551 9.19727 19.0098 L 9 19 L 3 19 C 2.46957 19 1.96101 18.7891 1.58594 18.4141 C 1.25765 18.0858 1.05515 17.6553 1.00977 17.1973 L 1 17 L 1 4 C 1 3.46957 1.21086 2.96101 1.58594 2.58594 C 1.96101 2.21086 2.46957 2 3 2 L 8 2 C 9.32608 2 10.5975 2.52716 11.5352 3.46484 C 11.7036 3.63332 11.8587 3.81256 12 4.00098 C 12.1413 3.81256 12.2964 3.63332 12.4648 3.46484 C 13.4025 2.52716 14.6739 2 16 2 L 21 2 C 21.5304 2 22.039 2.21086 22.4141 2.58594 C 22.7891 2.96101 23 3.46957 23 4 L 23 17 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">Môn học</p>
              <p className="text-sm font-medium">Toán</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 md:px-6 py-2 md:py-0">
            <div className="w-8 h-8 bg-[#f3f4f6] rounded-md flex items-center justify-center flex-shrink-0">
              <svg data-svg-id="SVG_6" className="w-4 h-4 text-[#565d6d]" viewBox="0 0 16 16">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.67 0 0 0.67 10.33 8)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15.5, -12)" d="M 21 11 C 21.5523 11 22 11.4477 22 12 C 22 12.5523 21.5523 13 21 13 L 10 13 C 9.44772 13 9 12.5523 9 12 C 9 11.4477 9.44772 11 10 11 L 21 11 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 10.33 12)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15.5, -18)" d="M 21 17 C 21.5523 17 22 17.4477 22 18 C 22 18.5523 21.5523 19 21 19 L 10 19 C 9.44772 19 9 18.5523 9 18 C 9 17.4477 9.44772 17 10 17 L 21 17 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 10.33 4)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15.5, -6)" d="M 21 5 C 21.5523 5 22 5.44772 22 6 C 22 6.55228 21.5523 7 21 7 L 10 7 C 9.44772 7 9 6.55228 9 6 C 9 5.44772 9.44772 5 10 5 L 21 5 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 3.33 6.67)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-5, -10)" d="M 6 9 C 6.55228 9 7 9.44772 7 10 C 7 10.5523 6.55228 11 6 11 L 4 11 C 3.44772 11 3 10.5523 3 10 C 3 9.44772 3.44772 9 4 9 L 6 9 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 3 5.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-4.5, -8)" d="M 4 10 L 4 7 C 3.44772 7 3 6.55228 3 6 C 3 5.44772 3.44772 5 4 5 L 5 5 L 5.10254 5.00488 C 5.60667 5.05621 6 5.48232 6 6 L 6 10 C 6 10.5523 5.55228 11 5 11 C 4.44772 11 4 10.5523 4 10 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 3.33 10.6)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-5, -15.9)" d="M 3.69146 13.0402 C 4.39189 12.7334 5.16649 12.7152 5.82232 13.0431 C 6.54554 13.4047 7.00006 14.1321 7.00006 15.0001 C 7.00001 15.5763 6.71792 16.0423 6.48736 16.3497 C 6.31323 16.5819 6.1019 16.804 5.90924 17.0001 L 6.00006 17.0001 L 6.1026 17.005 C 6.60672 17.0563 7.00006 17.4825 7.00006 18.0001 C 6.99999 18.5177 6.60669 18.9439 6.1026 18.9952 L 6.00006 19.0001 L 4.00006 19.0001 C 3.48243 19.0001 3.05633 18.6067 3.00494 18.1027 L 3.00006 18.0001 C 3.00006 17.4238 3.28217 16.957 3.51275 16.6495 C 3.75116 16.3317 4.0562 16.0299 4.29303 15.7931 C 4.5561 15.53 4.75122 15.3316 4.88775 15.1495 C 4.95858 15.0551 4.98567 14.9984 4.99615 14.9747 C 4.99274 14.9124 4.9802 14.8819 4.97369 14.8712 C 4.96591 14.8586 4.95359 14.8451 4.92779 14.8322 C 4.8836 14.8101 4.75139 14.7731 4.54205 14.8527 L 4.44732 14.8947 C 3.95339 15.1416 3.35254 14.9413 3.10553 14.4474 C 2.85855 13.9534 3.05885 13.3526 3.55279 13.1056 L 3.69146 13.0402 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">Số câu hỏi</p>
              <p className="text-sm font-medium">Phát hiện 10 câu hỏi</p>
            </div>
          </div>
        </div>

        {/* Search and Table Section */}
        <div className="max-w-[768px] mx-auto">
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg data-svg-id="SVG_7" className="w-4 h-4 text-[#565d6d]" viewBox="0 0 16 16">
          <g transform="matrix(1 0 0 1 0 0)">
            <g style={{  }}>
              <g transform="matrix(0.67 0 0 0.67 12.55 12.55)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-18.83, -18.83)" d="M 15.953 15.953 C 16.3191 15.5869 16.8981 15.5643 17.2909 15.8847 L 17.3671 15.953 L 21.7069 20.2929 L 21.7763 20.369 C 22.0963 20.7618 22.0729 21.3409 21.7069 21.7069 C 21.3409 22.0729 20.7618 22.0963 20.369 21.7763 L 20.2929 21.7069 L 15.953 17.3671 L 15.8847 17.2909 C 15.5643 16.8981 15.5869 16.3191 15.953 15.953 Z" strokeLinecap="round" />
              </g>
              <g transform="matrix(0.67 0 0 0.67 7.33 7.33)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-11, -11)" d="M 18 11 C 18 7.13401 14.866 4 11 4 C 7.13401 4 4 7.13401 4 11 C 4 14.866 7.13401 18 11 18 C 14.866 18 18 14.866 18 11 Z M 20 11 C 20 15.9706 15.9706 20 11 20 C 6.02944 20 2 15.9706 2 11 C 2 6.02944 6.02944 2 11 2 C 15.9706 2 20 6.02944 20 11 Z" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi ..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#dee1e6] rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#9a94de]/20 transition-all"
            />
          </div>

          {/* Table Header */}
          <div className="flex items-center px-4 py-2 border-b-2 border-[#dee1e6]/60 text-[12px] font-semibold text-[#565d6d] uppercase tracking-wider">
            <div className="flex-1">Câu hỏi</div>
            <div className="w-32 text-center">Đáp án đúng</div>
            <div className="w-24 text-right">Độ tự tin</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#dee1e6]/50">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 text-sm font-medium">{q.name}</div>
                <div className="w-32 flex justify-center">
                  <div className="w-7 h-7 bg-[#f3f4f6] border border-[#dee1e6]/50 rounded-md flex items-center justify-center text-[12px] font-semibold shadow-sm">
                    {q.answer}
                  </div>
                </div>
                <div className="w-24 flex justify-end">
                  <div className={`px-3 py-0.5 rounded-full text-[12px] font-semibold ${getStatusStyles(q.status)}`}>
                    {q.confidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#dee1e6] shadow-[0px_-4px_24px_0px_#0000000a] z-40">
        <div className="max-w-[1440px] mx-auto h-20 flex items-center justify-between px-4 lg:px-32">
          <button className="h-12 px-6 flex items-center gap-2 bg-white border border-[#dee1e6] rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors">
            <svg data-svg-id="SVG_8" className="w-4 h-4" viewBox="0 0 16 16">
          <g transform="matrix(1 0 0 1 0 0)">
            <g style={{  }}>
              <g transform="matrix(0.67 0 0 0.67 8 8)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(23,26,31)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.293 5.29295 C 14.6835 4.90243 15.3165 4.90243 15.707 5.29295 C 16.0976 5.68348 16.0976 6.31649 15.707 6.70702 L 10.4141 12 L 15.707 17.293 L 15.7754 17.3691 C 16.0957 17.7619 16.0731 18.3409 15.707 18.707 C 15.3409 19.0731 14.7619 19.0957 14.3691 18.7754 L 14.293 18.707 L 8.29297 12.707 C 7.90245 12.3165 7.90245 11.6835 8.29297 11.293 L 14.293 5.29295 Z" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
            Trở về
          </button>
          <button className="h-12 px-8 flex items-center gap-2 bg-[#9a94de] text-white rounded-md shadow-sm text-sm font-medium hover:bg-[#8a84ce] transition-colors">
            Xác nhận và tiếp tục
            <svg data-svg-id="SVG_9" className="w-4 h-4" viewBox="0 0 16 16">
          <g transform="matrix(1 0 0 1 0 0)">
            <g style={{  }}>
              <g transform="matrix(0.67 0 0 0.67 8 8)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
              </g>
              <g transform="matrix(0.67 0 0 0.67 8 8)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#dee1e6] py-6 px-4 lg:px-36 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#565d6d]">
        <div className="order-2 md:order-1">
          © 2026 SiroMix — All rights reserved.
        </div>
        <div className="flex items-center gap-4 order-1 md:order-2">
          <a href="#" className="hover:text-[#171a1f] transition-colors">Terms</a>
          <span className="text-[#dee1e6]">•</span>
          <a href="#" className="hover:text-[#171a1f] transition-colors">Privacy</a>
          <span className="text-[#dee1e6]">•</span>
          <a href="#" className="hover:text-[#171a1f] transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

// SVG Placeholders for post-processing
/*
<svg data-svg-id="SVG_1" />
<svg data-svg-id="SVG_2" />
<svg data-svg-id="SVG_3" />
<svg data-svg-id="SVG_4" />
<svg data-svg-id="SVG_5" />
<svg data-svg-id="SVG_6" />
<svg data-svg-id="SVG_7" />
<svg data-svg-id="SVG_8" />
<svg data-svg-id="SVG_9" />
*/