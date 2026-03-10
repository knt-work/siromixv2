import React from 'react';
import { Icon } from '@iconify/react';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#171a1f]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#dee1e6]/40 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-10 lg:px-36">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#9a94de]/10">
                <svg data-svg-id="SVG_1" className="h-[17px] w-[17px] text-[#9a94de]" viewBox="0 0 17 17">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.71 0 0 0.71 8.51 4.96)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12.01, -7)" d="M 1.00348 6.99475 C 1.00353 6.60711 1.11606 6.22772 1.3277 5.90295 C 1.53745 5.58123 1.83572 5.32645 2.1861 5.16956 L 10.7554 1.27014 L 10.9029 1.20764 C 11.2518 1.07053 11.6237 0.99969 11.9996 0.999634 C 12.4291 0.999634 12.8539 1.09195 13.2447 1.27014 L 21.8345 5.1803 C 22.1849 5.33718 22.4822 5.59098 22.692 5.91272 C 22.9037 6.2375 23.0161 6.61682 23.0162 7.00452 C 23.0162 7.39238 22.9038 7.77237 22.692 8.09729 C 22.482 8.41928 22.1833 8.67286 21.8326 8.82971 L 21.8336 8.83069 L 13.2545 12.7291 L 13.2554 12.7301 C 12.9133 12.8861 12.545 12.9757 12.1705 12.9957 L 12.0103 13.0006 C 11.6343 13.0006 11.2617 12.9298 10.9127 12.7926 L 10.7652 12.7301 L 2.18512 8.81995 C 1.83533 8.66301 1.53718 8.40883 1.3277 8.08752 C 1.11587 7.76261 1.00348 7.38262 1.00348 6.99475 Z M 3.0152 6.99963 L 11.5943 10.9098 L 11.6949 10.9489 C 11.7964 10.9826 11.9029 11.0006 12.0103 11.0006 L 12.1168 10.9948 C 12.2232 10.9833 12.3276 10.9544 12.4254 10.9098 L 21.0064 7.0094 L 21.0162 7.00452 L 21.0054 7.00061 L 12.4156 3.09045 L 12.4146 3.08948 C 12.2845 3.03019 12.1426 2.99963 11.9996 2.99963 C 11.8925 2.99968 11.7863 3.01684 11.6851 3.05042 L 11.5855 3.08948 L 11.5845 3.09045 L 3.00348 6.99475 L 3.0152 6.99963 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.71 0 0 0.71 8.5 10.27)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -14.5)" d="M 21.9922 11 C 22.5098 10.996 22.9389 11.386 22.9941 11.8896 L 23 11.9922 L 22.9961 12.1367 C 22.9743 12.4742 22.867 12.8019 22.6836 13.0879 C 22.4741 13.4144 22.1741 13.6729 21.8203 13.832 L 13.2441 17.7305 L 13.2422 17.7314 C 12.8535 17.9074 12.4315 17.998 12.0049 17.998 C 11.5782 17.998 11.1563 17.9074 10.7676 17.7314 L 10.7666 17.7305 L 2.16602 13.8203 L 2.16016 13.8174 C 1.813 13.6567 1.51909 13.3997 1.31348 13.0771 C 1.10795 12.7546 0.99906 12.3795 1.00001 11.9971 L 1.00587 11.8955 C 1.05825 11.3913 1.48511 10.9987 2.00294 11 C 2.55484 11.0016 3.00011 11.4501 2.99903 12.002 L 11.5918 15.9092 L 11.5928 15.9092 C 11.7223 15.9678 11.8628 15.998 12.0049 15.998 C 12.1467 15.998 12.2868 15.9675 12.416 15.9092 L 20.9961 12.0098 L 21 12.0078 L 21.0039 11.9053 C 21.0513 11.4008 21.4745 11.0041 21.9922 11 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.71 0 0 0.71 8.5 13.81)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -19.5)" d="M 21.9922 16 C 22.5098 15.996 22.9389 16.386 22.9941 16.8896 L 23 16.9922 L 22.9961 17.1367 C 22.9743 17.4742 22.867 17.8019 22.6836 18.0879 C 22.4741 18.4144 22.1741 18.6729 21.8203 18.832 L 13.2441 22.7305 L 13.2422 22.7314 C 12.8535 22.9074 12.4315 22.998 12.0049 22.998 C 11.5782 22.998 11.1563 22.9074 10.7676 22.7314 L 10.7666 22.7305 L 2.16602 18.8203 L 2.16016 18.8174 C 1.813 18.6567 1.51909 18.3997 1.31348 18.0771 C 1.10795 17.7546 0.99906 17.3795 1.00001 16.9971 L 1.00587 16.8955 C 1.05825 16.3913 1.48511 15.9987 2.00294 16 C 2.55484 16.0016 3.00011 16.4501 2.99903 17.002 L 11.5918 20.9092 L 11.5928 20.9092 C 11.7223 20.9678 11.8628 20.998 12.0049 20.998 C 12.1467 20.998 12.2868 20.9675 12.416 20.9092 L 20.9961 17.0098 L 21 17.0078 L 21.0039 16.9053 C 21.0513 16.4008 21.4745 16.0041 21.9922 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">SiroMix</span>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f]">Features</a>
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f]">User Guide</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f6] shadow-sm overflow-hidden">
              <img src="./assets/IMG_1.webp" alt="Alex Morgan" className="h-full w-full object-cover" />
            </div>
            <div className="hidden items-center gap-1 lg:flex">
              <span className="text-sm font-medium">Alex Morgan</span>
              <svg data-svg-id="SVG_2" className="h-4 w-4 text-[#565d6d]" viewBox="0 0 16 16">
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 8.29302 C 17.6835 7.90249 18.3165 7.90249 18.707 8.29302 C 19.0976 8.68354 19.0976 9.31655 18.707 9.70708 L 12.707 15.7071 C 12.3165 16.0976 11.6835 16.0976 11.293 15.7071 L 5.29298 9.70708 L 5.22462 9.63091 C 4.90427 9.23813 4.92686 8.65913 5.29298 8.29302 C 5.65909 7.9269 6.2381 7.90431 6.63087 8.22466 L 6.70704 8.29302 L 12 13.586 L 17.293 8.29302 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
            </div>
            {/* Mobile Menu Icon */}
            <button className="md:hidden">
              <Icon icon="lucide:menu" className="h-6 w-6 text-[#565d6d]" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 lg:px-36">
        {/* Success Notification */}
        <div className="mb-8 flex justify-end">
          <div className="flex w-full max-w-[493px] items-center gap-3 rounded-md border border-[#9a94de]/20 bg-[#F5F4FB] p-3 shadow-md">
            <svg data-svg-id="SVG_3" className="h-[18px] w-[18px] text-[#9a94de]" viewBox="0 0 18 18">
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.75 0 0 0.75 9 9)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
            </g>
            <g transform="matrix(0.75 0 0 0.75 9 9)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
            <span className="text-sm font-medium text-[#19191F]">
              Đã bắt đầu xử lý đề thi — theo dõi tiến trình trong Quản lý tác vụ
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Tạo Đề Thi Mới</h1>
          <p className="mt-2 text-base text-[#565d6d]">
            Cung cấp thông tin đề thi và tải lên file Word để bắt đầu xử lý.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="rounded-[10px] border border-[#dee1e6]/60 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 p-8 lg:grid-cols-2">
            
            {/* Left Column */}
            <div className="space-y-6">
              {/* Năm Học */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Năm Học</label>
                  <span className="text-[12px] text-[#565d6d]">Chọn năm học cho đề thi này.</span>
                </div>
                <div className="relative">
                  <select className="w-full appearance-none rounded-md border border-[#dee1e6] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20">
                    <option>2023 - 2024</option>
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <svg data-svg-id="SVG_4" className="h-4 w-4 text-[#565d6d]" viewBox="0 0 16 16">
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 8.29302 C 17.6835 7.90249 18.3165 7.90249 18.707 8.29302 C 19.0976 8.68354 19.0976 9.31655 18.707 9.70708 L 12.707 15.7071 C 12.3165 16.0976 11.6835 16.0976 11.293 15.7071 L 5.29298 9.70708 L 5.22462 9.63091 C 4.90427 9.23813 4.92686 8.65913 5.29298 8.29302 C 5.65909 7.9269 6.2381 7.90431 6.63087 8.22466 L 6.70704 8.29302 L 12 13.586 L 17.293 8.29302 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
                  </div>
                </div>
              </div>

              {/* Môn Học */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Môn Học</label>
                <input 
                  type="text" 
                  defaultValue="Sinh học"
                  className="w-full rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20"
                />
              </div>

              {/* Số Lượng Mã Đề */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Số Lượng Mã Đề</label>
                <input 
                  type="text" 
                  defaultValue="4"
                  className="w-full rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20"
                />
                <p className="text-[12px] text-[#565d6d]">Số lượng mã đề cần tạo.</p>
              </div>

              {/* Ghi chú */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chú</label>
                <textarea 
                  placeholder="Không bắt buộc — thêm hướng dẫn hoặc ghi chú cho người chấm."
                  className="h-36 w-full resize-none rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20"
                ></textarea>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Tên Kì Thi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên Kì Thi</label>
                <input 
                  type="text" 
                  defaultValue="Algebra II Final Assessment"
                  className="w-full rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20"
                />
              </div>

              {/* Thời Gian Thi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Thời Gian Thi (phút)</label>
                <input 
                  type="text" 
                  defaultValue="120"
                  className="w-full rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#9a94de]/20"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tải lên các file đề thô</label>
                <div className="flex h-40 flex-col items-center justify-center rounded-md border-2 border-dashed border-[#dee1e6]/80 bg-[#f3f4f6]/10 p-4 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9a94de]/10">
                    <svg data-svg-id="SVG_5" className="h-6 w-6 text-[#9a94de]" viewBox="0 0 24 24">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(1 0 0 1 12 17)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -17)" d="M 11 21 L 11 13 C 11 12.4477 11.4477 12 12 12 C 12.5523 12 13 12.4477 13 13 L 13 21 C 13 21.5523 12.5523 22 12 22 C 11.4477 22 11 21.5523 11 21 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 12 9.62)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -9.62)" d="M 8.36978 2.02809 C 9.57988 1.93212 10.7965 2.11279 11.9264 2.55641 C 13.0562 3.00005 14.0707 3.69509 14.8922 4.58864 C 15.5422 5.29569 16.0556 6.11344 16.4147 6.99977 L 17.4997 6.99977 L 17.7204 7.00466 C 18.8225 7.04874 19.8883 7.42274 20.777 8.08181 C 21.7247 8.78461 22.4207 9.77407 22.7633 10.9031 C 23.1059 12.0324 23.076 13.2422 22.6784 14.3533 C 22.2807 15.4643 21.5366 16.4185 20.5553 17.074 L 20.4674 17.1258 C 20.0197 17.3633 19.4562 17.2281 19.1686 16.7976 C 18.8618 16.3384 18.9857 15.7177 19.445 15.4109 L 19.6715 15.2449 C 20.1839 14.8397 20.5742 14.298 20.7956 13.6795 C 21.0486 12.9725 21.0682 12.2027 20.8502 11.4841 C 20.6323 10.7655 20.1888 10.1356 19.5856 9.68825 C 19.0579 9.29694 18.432 9.06382 17.7809 9.01149 L 17.4997 8.99977 L 15.7096 8.99977 C 15.2677 8.99961 14.8781 8.7094 14.7516 8.28591 C 14.4912 7.4137 14.0356 6.61228 13.4196 5.94216 C 12.8034 5.27193 12.0424 4.75046 11.195 4.41774 C 10.3476 4.08511 9.43545 3.94929 8.52798 4.02126 C 7.62048 4.09327 6.74104 4.37068 5.95669 4.83278 C 5.17228 5.29492 4.50347 5.93026 4.00064 6.68923 C 3.49794 7.44809 3.17405 8.31128 3.05435 9.21364 C 2.93464 10.1162 3.02261 11.0344 3.31021 11.8982 C 3.59781 12.7619 4.07774 13.5494 4.7145 14.2 C 5.10067 14.5947 5.09448 15.2278 4.69985 15.614 C 4.30522 16.0003 3.67212 15.9929 3.28579 15.5984 L 2.9772 15.2644 C 2.28054 14.4667 1.7473 13.5378 1.41177 12.53 C 1.02831 11.3783 0.912339 10.1543 1.07192 8.95095 C 1.23152 7.74768 1.66329 6.59664 2.33364 5.58474 C 3.00409 4.57277 3.89616 3.72631 4.94204 3.11013 C 5.98778 2.49406 7.15987 2.12411 8.36978 2.02809 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 12 15)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(154,148,222)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -15)" d="M 11.3691 12.2246 C 11.7619 11.9043 12.3409 11.9269 12.707 12.293 L 16.707 16.293 L 16.7754 16.3692 C 17.0957 16.7619 17.0731 17.3409 16.707 17.707 C 16.3409 18.0732 15.7619 18.0958 15.3691 17.7754 L 15.293 17.707 L 12 14.4141 L 8.70702 17.707 C 8.31649 18.0976 7.68348 18.0976 7.29295 17.707 C 6.90243 17.3165 6.90243 16.6835 7.29295 16.293 L 11.293 12.293 L 11.3691 12.2246 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
                  </div>
                  <p className="text-sm font-medium">Kéo và thả file .doc/.docx vào đây, hoặc nhấn vào để tải lên.</p>
                  <p className="mt-1 text-[12px] text-[#565d6d]">Định dạng được hỗ trợ: .doc, .docx • Tối đa 20MB mỗi file</p>
                </div>
              </div>

              {/* File List */}
              <div className="space-y-3">
                {/* File 1 */}
                <div className="flex items-center justify-between rounded-md border border-[#dee1e6]/60 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <svg data-svg-id="SVG_7" className="h-4 w-4 text-[#565d6d]/50" viewBox="0 0 16 16">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(0.67 0 0 0.67 6 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -12)" d="M 7 12 C 7 10.8954 7.89543 10 9 10 C 10.1046 10 11 10.8954 11 12 C 11 13.1046 10.1046 14 9 14 C 7.89543 14 7 13.1046 7 12 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 6 3.33)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -5)" d="M 7 5 C 7 3.89543 7.89543 3 9 3 C 10.1046 3 11 3.89543 11 5 C 11 6.10457 10.1046 7 9 7 C 7.89543 7 7 6.10457 7 5 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 6 12.67)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -19)" d="M 7 19 C 7 17.8954 7.89543 17 9 17 C 10.1046 17 11 17.8954 11 19 C 11 20.1046 10.1046 21 9 21 C 7.89543 21 7 20.1046 7 19 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -12)" d="M 13 12 C 13 10.8954 13.8954 10 15 10 C 16.1046 10 17 10.8954 17 12 C 17 13.1046 16.1046 14 15 14 C 13.8954 14 13 13.1046 13 12 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 3.33)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -5)" d="M 13 5 C 13 3.89543 13.8954 3 15 3 C 16.1046 3 17 3.89543 17 5 C 17 6.10457 16.1046 7 15 7 C 13.8954 7 13 6.10457 13 5 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 12.67)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -19)" d="M 13 19 C 13 17.8954 13.8954 17 15 17 C 16.1046 17 17 17.8954 17 19 C 17 20.1046 16.1046 21 15 21 C 13.8954 21 13 20.1046 13 19 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#9a94de]/10">
                      <svg data-svg-id="SVG_6" className="h-4 w-4 text-[#9a94de]" viewBox="0 0 16 16">
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
                      <p className="text-sm font-medium">Math_Final_Master_v2.docx</p>
                      <p className="text-[12px] text-[#565d6d]">2.4 MB</p>
                    </div>
                  </div>
                  <button className="p-1 text-[#565d6d] hover:text-red-500">
                    <svg data-svg-id="SVG_8" className="h-4 w-4" viewBox="0 0 16 16">
              <g transform="matrix(1 0 0 1 0 0)">
                <g style={{  }}>
                  <g transform="matrix(0.67 0 0 0.67 8 8)">
                    <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 5.29302 C 17.6835 4.90249 18.3165 4.90249 18.707 5.29302 C 19.0976 5.68354 19.0976 6.31655 18.707 6.70708 L 6.70703 18.7071 C 6.31651 19.0976 5.68349 19.0976 5.29297 18.7071 C 4.90245 18.3166 4.90245 17.6835 5.29297 17.293 L 17.293 5.29302 Z" strokeLinecap="round" />
                  </g>
                  <g transform="matrix(0.67 0 0 0.67 8 8)">
                    <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 5.29297 5.29298 C 5.65908 4.92686 6.23809 4.90427 6.63086 5.22462 L 6.70703 5.29298 L 18.707 17.293 L 18.7754 17.3692 C 19.0957 17.7619 19.0731 18.3409 18.707 18.707 C 18.3409 19.0732 17.7619 19.0958 17.3691 18.7754 L 17.293 18.707 L 5.29297 6.70704 L 5.22461 6.63087 C 4.90426 6.2381 4.92685 5.65909 5.29297 5.29298 Z" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </svg>
                  </button>
                </div>

                {/* File 2 */}
                <div className="flex items-center justify-between rounded-md border border-[#dee1e6]/60 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <svg data-svg-id="SVG_10" className="h-4 w-4 text-[#565d6d]/50" viewBox="0 0 16 16">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(0.67 0 0 0.67 6 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -12)" d="M 7 12 C 7 10.8954 7.89543 10 9 10 C 10.1046 10 11 10.8954 11 12 C 11 13.1046 10.1046 14 9 14 C 7.89543 14 7 13.1046 7 12 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 6 3.33)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -5)" d="M 7 5 C 7 3.89543 7.89543 3 9 3 C 10.1046 3 11 3.89543 11 5 C 11 6.10457 10.1046 7 9 7 C 7.89543 7 7 6.10457 7 5 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 6 12.67)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-9, -19)" d="M 7 19 C 7 17.8954 7.89543 17 9 17 C 10.1046 17 11 17.8954 11 19 C 11 20.1046 10.1046 21 9 21 C 7.89543 21 7 20.1046 7 19 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -12)" d="M 13 12 C 13 10.8954 13.8954 10 15 10 C 16.1046 10 17 10.8954 17 12 C 17 13.1046 16.1046 14 15 14 C 13.8954 14 13 13.1046 13 12 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 3.33)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -5)" d="M 13 5 C 13 3.89543 13.8954 3 15 3 C 16.1046 3 17 3.89543 17 5 C 17 6.10457 16.1046 7 15 7 C 13.8954 7 13 6.10457 13 5 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(0.67 0 0 0.67 10 12.67)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-15, -19)" d="M 13 19 C 13 17.8954 13.8954 17 15 17 C 16.1046 17 17 17.8954 17 19 C 17 20.1046 16.1046 21 15 21 C 13.8954 21 13 20.1046 13 19 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#9a94de]/10">
                      <svg data-svg-id="SVG_9" className="h-4 w-4 text-[#9a94de]" viewBox="0 0 16 16">
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
                      <p className="text-sm font-medium">Formula_Reference_Sheet.doc</p>
                      <p className="text-[12px] text-[#565d6d]">840 KB</p>
                    </div>
                  </div>
                  <button className="p-1 text-[#565d6d] hover:text-red-500">
                    <svg data-svg-id="SVG_11" className="h-4 w-4" viewBox="0 0 16 16">
              <g transform="matrix(1 0 0 1 0 0)">
                <g style={{  }}>
                  <g transform="matrix(0.67 0 0 0.67 8 8)">
                    <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17.293 5.29302 C 17.6835 4.90249 18.3165 4.90249 18.707 5.29302 C 19.0976 5.68354 19.0976 6.31655 18.707 6.70708 L 6.70703 18.7071 C 6.31651 19.0976 5.68349 19.0976 5.29297 18.7071 C 4.90245 18.3166 4.90245 17.6835 5.29297 17.293 L 17.293 5.29302 Z" strokeLinecap="round" />
                  </g>
                  <g transform="matrix(0.67 0 0 0.67 8 8)">
                    <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 5.29297 5.29298 C 5.65908 4.92686 6.23809 4.90427 6.63086 5.22462 L 6.70703 5.29298 L 18.707 17.293 L 18.7754 17.3692 C 19.0957 17.7619 19.0731 18.3409 18.707 18.707 C 18.3409 19.0732 17.7619 19.0958 17.3691 18.7754 L 17.293 18.707 L 5.29297 6.70704 L 5.22461 6.63087 C 4.90426 6.2381 4.92685 5.65909 5.29297 5.29298 Z" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 text-[12px] font-medium text-[#565d6d]">
                  <span>Đã chọn 2 files</span>
                  <span>Tổng cộng: 3.24 MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="flex items-center justify-between border-t border-[#dee1e6]/60 bg-[#f3f4f6]/5 p-8">
            <button className="px-6 py-3 text-sm font-medium text-[#565d6d] hover:bg-gray-100 rounded-md transition-colors">
              Lưu vào nháp
            </button>
            <button className="rounded-md bg-[#9a94de] px-8 py-3 text-sm font-medium text-white shadow-md hover:bg-[#8a84ce] transition-colors">
              Trộn đề ngay
            </button>
          </div>
        </div>

        {/* Design Specifications Section */}
        <div className="mt-24 space-y-8 opacity-90">
          <div className="border-t border-dashed border-[#dee1e6] pt-12">
            <h2 className="text-lg font-semibold">Design Specifications: State Variants</h2>
            <p className="text-sm text-[#565d6d]">Isolated states requested in the execution plan for engineering handoff.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Validation Error Variant */}
            <div className="rounded-[10px] border border-[#dee1e6]/60 bg-white p-6 shadow-sm">
              <span className="text-[14px] font-medium uppercase tracking-widest text-[#565d6d]">Validation Error</span>
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-[#d3595e]">Tên kì thi</label>
                <input 
                  type="text" 
                  placeholder="e.g., Math Midterm — Grade 10"
                  className="w-full rounded-md border border-[#dee1e6] px-4 py-3 text-sm outline-none"
                />
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#d3595e]">
                  <svg data-svg-id="SVG_12" className="h-3.5 w-3.5" viewBox="0 0 14 14">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.58 0 0 0.58 7 7)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.58 0 0 0.58 7 5.83)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -10)" d="M 11 12 L 11 8 C 11 7.44772 11.4477 7 12 7 C 12.5523 7 13 7.44772 13 8 L 13 12 C 13 12.5523 12.5523 13 12 13 C 11.4477 13 11 12.5523 11 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.58 0 0 0.58 7 9.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16)" d="M 12.0098 15 L 12.1123 15.0049 C 12.6165 15.0561 13.0098 15.4822 13.0098 16 C 13.0098 16.5178 12.6165 16.9439 12.1123 16.9951 L 12.0098 17 L 12 17 C 11.4477 17 11 16.5523 11 16 C 11 15.4477 11.4477 15 12 15 L 12.0098 15 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Thông tin bắt buộc phải nhập</span>
                </div>
              </div>
            </div>

            {/* File Error Variant */}
            <div className="rounded-[10px] border border-[#dee1e6]/60 bg-white p-6 shadow-sm">
              <span className="text-[14px] font-medium uppercase tracking-widest text-[#565d6d]">File Error</span>
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium">Tải lên các file đề thô</label>
                <div className="flex h-[124px] flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d3595e]/50 bg-[#d3595e]/5 p-4 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#d3595e]/10">
                    <svg data-svg-id="SVG_13" className="h-5 w-5 text-[#d3595e]" viewBox="0 0 20 20">
                    <g transform="matrix(1 0 0 1 0 0)">
                      <g style={{  }}>
                        <g transform="matrix(0.83 0 0 0.83 10 10)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                        </g>
                        <g transform="matrix(0.83 0 0 0.83 10 8.33)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -10)" d="M 11 12 L 11 8 C 11 7.44772 11.4477 7 12 7 C 12.5523 7 13 7.44772 13 8 L 13 12 C 13 12.5523 12.5523 13 12 13 C 11.4477 13 11 12.5523 11 12 Z" strokeLinecap="round" />
                        </g>
                        <g transform="matrix(0.83 0 0 0.83 10 13.33)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16)" d="M 12.0098 15 L 12.1123 15.0049 C 12.6165 15.0561 13.0098 15.4822 13.0098 16 C 13.0098 16.5178 12.6165 16.9439 12.1123 16.9951 L 12.0098 17 L 12 17 C 11.4477 17 11 16.5523 11 16 C 11 15.4477 11.4477 15 12 15 L 12.0098 15 Z" strokeLinecap="round" />
                        </g>
                      </g>
                    </g>
                  </svg>
                  </div>
                  <p className="text-sm font-medium">Tải lên thất bại</p>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#d3595e]">
                  <svg data-svg-id="SVG_14" className="h-3.5 w-3.5" viewBox="0 0 14 14">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.58 0 0 0.58 7 7)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.58 0 0 0.58 7 5.83)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -10)" d="M 11 12 L 11 8 C 11 7.44772 11.4477 7 12 7 C 12.5523 7 13 7.44772 13 8 L 13 12 C 13 12.5523 12.5523 13 12 13 C 11.4477 13 11 12.5523 11 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.58 0 0 0.58 7 9.33)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(211,89,94)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16)" d="M 12.0098 15 L 12.1123 15.0049 C 12.6165 15.0561 13.0098 15.4822 13.0098 16 C 13.0098 16.5178 12.6165 16.9439 12.1123 16.9951 L 12.0098 17 L 12 17 C 11.4477 17 11 16.5523 11 16 C 11 15.4477 11.4477 15 12 15 L 12.0098 15 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Kích thước file vượt quá 20MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Loading Variant */}
          <div className="rounded-[10px] border border-[#dee1e6]/60 bg-white p-6 shadow-sm">
            <span className="text-[14px] font-medium uppercase tracking-widest text-[#565d6d]">Submission Started (Loading)</span>
            <div className="mt-6 flex items-center justify-end gap-4 rounded-md border border-[#dee1e6]/60 bg-[#f3f4f6]/5 p-6">
              <button className="px-6 py-3 text-sm font-medium text-[#171a1f] opacity-50 cursor-not-allowed">
                Lưu vào nháp
              </button>
              <button className="flex items-center gap-2 rounded-md bg-[#9a94de] px-6 py-3 text-sm font-medium text-white opacity-50 shadow-md cursor-not-allowed">
                <svg data-svg-id="SVG_15" className="h-[22px] w-[22px] animate-spin" viewBox="0 0 22 22">
                  <g transform="matrix(1 0 0 1 0 0)">
                    <g style={{  }}>
                      <g transform="matrix(0.92 0 0 0.92 11 11)">
                        <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 10.9996 C 21.5523 10.9996 22 11.4483 22 12.0005 L 21.9922 12.3951 C 21.9141 14.3674 21.2536 16.2758 20.0898 17.8775 C 18.8485 19.5859 17.0983 20.8578 15.0898 21.5103 C 13.0814 22.1628 10.9176 22.1629 8.90918 21.5103 C 6.90105 20.8577 5.15132 19.5857 3.91016 17.8775 C 2.66893 16.169 2 14.1113 2 11.9996 C 2.00002 9.8878 2.66889 7.83009 3.91016 6.12163 C 5.15141 4.41329 6.90184 3.14138 8.91016 2.48882 C 10.793 1.87712 12.8121 1.83924 14.7119 2.37456 L 15.0898 2.48882 L 15.1855 2.52593 C 15.6491 2.73041 15.8921 3.25633 15.7324 3.74859 C 15.5725 4.24089 15.0666 4.52441 14.5713 4.41753 L 14.4717 4.39116 L 14.1689 4.29937 C 12.6491 3.87125 11.0335 3.90176 9.52734 4.39116 C 7.92085 4.91326 6.52124 5.93084 5.52832 7.29741 C 4.53531 8.66418 4.00001 10.3102 4 11.9996 C 4 13.6889 4.53447 15.335 5.52734 16.7017 C 6.52027 18.0684 7.92076 19.0858 9.52734 19.608 C 11.134 20.13 12.865 20.1299 14.4717 19.608 C 16.0784 19.086 17.4786 18.0684 18.4717 16.7017 C 19.4027 15.4204 19.9317 13.8939 19.9941 12.316 L 20 11.9996 C 20.0002 11.4475 20.4479 10.9996 21 10.9996 Z" strokeLinecap="round" />
                      </g>
                    </g>
                  </g>
                </svg>
                <span>Đang xử lý...</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#dee1e6]/40 bg-white py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-10 lg:px-36">
          <span className="text-sm text-[#565d6d]">© 2026 SiroMix — All rights reserved.</span>
          <div className="flex items-center gap-6 text-sm text-[#565d6d]">
            <a href="#" className="hover:text-[#171a1f]">Terms</a>
            <span className="text-[#dee1e6]">•</span>
            <a href="#" className="hover:text-[#171a1f]">Privacy</a>
            <span className="text-[#dee1e6]">•</span>
            <a href="#" className="hover:text-[#171a1f]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Note: The SVG IDs used here (SVG_1 to SVG_15) will be replaced by the original SVG content during post-processing.
// The layout uses Flexbox and Grid for responsiveness, stacking elements on mobile and using multi-column layouts on desktop.
// All text content and image paths have been preserved exactly as requested.